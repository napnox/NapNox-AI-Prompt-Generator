<?php
/**
 * Gemini API client.
 *
 * @package NapNox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Builds the master prompt and talks to the Gemini REST API.
 *
 * Mirrors `api/_shared.ts`, which does the same job for the local dev server.
 */
class NapNox_Gemini {

	const ENDPOINT     = 'https://generativelanguage.googleapis.com/v1beta/models/';
	const MAX_ATTEMPTS = 3;
	const TIMEOUT      = 60;

	/**
	 * Allowed reference image types.
	 *
	 * @var array
	 */
	private static $image_types = array( 'image/jpeg', 'image/png', 'image/webp' );

	/**
	 * Multibyte-safe string length, falling back when mbstring is unavailable.
	 *
	 * @param string $text Text to measure.
	 * @return int
	 */
	private static function length( $text ) {
		return function_exists( 'mb_strlen' ) ? mb_strlen( $text ) : strlen( $text );
	}

	/**
	 * Multibyte-safe substring, falling back when mbstring is unavailable.
	 *
	 * @param string $text  Text to cut.
	 * @param int    $start Start offset.
	 * @param int    $len   Length.
	 * @return string
	 */
	private static function cut( $text, $start, $len ) {
		return function_exists( 'mb_substr' ) ? mb_substr( $text, $start, $len ) : substr( $text, $start, $len );
	}

	/**
	 * Validate and normalise the request payload.
	 *
	 * Everything is checked against the shared master config - including each
	 * category's own subtypes, filters and platform options - so the endpoint
	 * cannot be repurposed as a general-purpose proxy to your Gemini quota.
	 *
	 * @param array $body Raw request body.
	 * @return array|WP_Error
	 */
	public static function validate( $body ) {
		$max_idea    = NapNox_Config::master_default( 'maxInputChars', 2000 );
		$max_context = NapNox_Config::master_default( 'maxContextChars', 1000 );
		$max_vars    = NapNox_Config::master_default( 'maxVariations', 5 );
		$max_bytes   = NapNox_Config::master_default( 'maxImageBytes', 4194304 );

		$idea = isset( $body['idea'] ) ? trim( wp_strip_all_tags( (string) $body['idea'] ) ) : '';
		if ( self::length( $idea ) < 3 ) {
			return new WP_Error(
				'invalid_input',
				__( 'Describe what you want a prompt for (at least 3 characters).', 'napnox-prompts' ),
				array( 'status' => 400 )
			);
		}
		if ( self::length( $idea ) > $max_idea ) {
			return new WP_Error(
				'invalid_input',
				sprintf( /* translators: %d: character limit */ __( 'Your idea must be %d characters or fewer.', 'napnox-prompts' ), $max_idea ),
				array( 'status' => 400 )
			);
		}

		$category_id = isset( $body['category'] ) ? sanitize_text_field( (string) $body['category'] ) : 'auto';
		$category    = 'auto' === $category_id ? null : NapNox_Config::category( $category_id );
		if ( 'auto' !== $category_id && ! $category ) {
			return new WP_Error( 'invalid_input', __( 'Unknown category.', 'napnox-prompts' ), array( 'status' => 400 ) );
		}

		// Subtype must come from the selected category's own list.
		$subtype = '';
		if ( $category ) {
			$subtype = isset( $body['subtype'] ) ? sanitize_text_field( (string) $body['subtype'] ) : '';
			if ( '' === $subtype ) {
				$subtype = isset( $category['subtypes'][0] ) ? $category['subtypes'][0] : '';
			}
			if ( ! in_array( $subtype, (array) $category['subtypes'], true ) ) {
				return new WP_Error( 'invalid_input', __( 'Unknown type for this category.', 'napnox-prompts' ), array( 'status' => 400 ) );
			}
		}

		// Platform must come from the category's own options, or the auto list.
		if ( $category ) {
			$platform_options = (array) $category['platform']['options'];
		} else {
			$auto             = NapNox_Config::auto();
			$platform_options = isset( $auto['platforms'] ) ? (array) $auto['platforms'] : array();
		}

		$platform_value = isset( $body['platform'] ) ? sanitize_text_field( (string) $body['platform'] ) : '';
		if ( '' === $platform_value ) {
			$platform_value = isset( $platform_options[0]['value'] ) ? $platform_options[0]['value'] : 'auto';
		}

		$platform = null;
		foreach ( $platform_options as $option ) {
			if ( isset( $option['value'] ) && $option['value'] === $platform_value ) {
				$platform = $option;
				break;
			}
		}
		if ( ! $platform ) {
			return new WP_Error( 'invalid_input', __( 'Unknown platform for this category.', 'napnox-prompts' ), array( 'status' => 400 ) );
		}

		// Each of the category's own filters, validated against its definition.
		$filters = array();
		if ( $category ) {
			$raw = isset( $body['filters'] ) && is_array( $body['filters'] ) ? $body['filters'] : array();
			foreach ( (array) $category['filters'] as $filter ) {
				$value = self::validate_filter( $filter, isset( $raw[ $filter['id'] ] ) ? $raw[ $filter['id'] ] : null, $max_context );
				if ( is_wp_error( $value ) ) {
					return $value;
				}
				$filters[ $filter['id'] ] = $value;
			}
		}

		$detail_value = isset( $body['detail'] ) ? sanitize_text_field( (string) $body['detail'] ) : 'balanced';
		$detail       = NapNox_Config::find( 'detailLevels', $detail_value );
		if ( ! $detail ) {
			return new WP_Error( 'invalid_input', __( 'Unknown detail level.', 'napnox-prompts' ), array( 'status' => 400 ) );
		}

		$num = isset( $body['numVariations'] ) ? (int) $body['numVariations'] : NapNox_Config::master_default( 'numVariations', 3 );
		$num = max( 1, min( $max_vars, $num ) );

		$context = isset( $body['context'] ) ? trim( wp_strip_all_tags( (string) $body['context'] ) ) : '';
		if ( self::length( $context ) > $max_context ) {
			$context = self::cut( $context, 0, $max_context );
		}

		$image = null;
		if ( ! empty( $body['image'] ) && is_array( $body['image'] ) ) {
			$base64    = isset( $body['image']['base64'] ) ? (string) $body['image']['base64'] : '';
			$mime_type = isset( $body['image']['mimeType'] ) ? (string) $body['image']['mimeType'] : '';

			if ( ! in_array( $mime_type, self::$image_types, true ) ) {
				return new WP_Error( 'invalid_input', __( 'Unsupported image type. Use JPG, PNG or WebP.', 'napnox-prompts' ), array( 'status' => 400 ) );
			}
			if ( ! preg_match( '#^[A-Za-z0-9+/]*={0,2}$#', $base64 ) ) {
				return new WP_Error( 'invalid_input', __( 'Malformed image upload.', 'napnox-prompts' ), array( 'status' => 400 ) );
			}
			if ( ( strlen( $base64 ) * 3 / 4 ) > $max_bytes ) {
				return new WP_Error( 'invalid_input', __( 'Image is too large. The maximum size is 4MB.', 'napnox-prompts' ), array( 'status' => 400 ) );
			}
			$image = array(
				'base64'   => $base64,
				'mimeType' => $mime_type,
			);
		}

		return array(
			'idea'          => $idea,
			'category'      => $category,
			'subtype'       => $subtype,
			'platform'      => $platform,
			'filters'       => $filters,
			'detail'        => $detail,
			'numVariations' => $num,
			'context'       => $context,
			'image'         => $image,
		);
	}

	/**
	 * Validate a single category filter against its original definition.
	 *
	 * Omitted values fall back to the filter's default rather than failing.
	 *
	 * @param array $filter      Filter definition.
	 * @param mixed $raw         Submitted value.
	 * @param int   $max_context Maximum textarea length.
	 * @return string|bool|WP_Error
	 */
	private static function validate_filter( $filter, $raw, $max_context ) {
		$type = isset( $filter['type'] ) ? $filter['type'] : 'select';

		if ( 'toggle' === $type ) {
			if ( null === $raw ) {
				return ! empty( $filter['defaultValue'] );
			}
			return (bool) $raw;
		}

		if ( 'textarea' === $type ) {
			$value = null === $raw ? '' : trim( wp_strip_all_tags( (string) $raw ) );
			if ( self::length( $value ) > $max_context ) {
				$value = self::cut( $value, 0, $max_context );
			}
			return $value;
		}

		if ( 'file' === $type ) {
			return '';
		}

		$options = isset( $filter['options'] ) ? (array) $filter['options'] : array();
		$allowed = array();
		foreach ( $options as $option ) {
			if ( isset( $option['value'] ) ) {
				$allowed[] = $option['value'];
			}
		}

		if ( null === $raw || '' === $raw ) {
			$preset = isset( $filter['defaultValue'] ) ? $filter['defaultValue'] : null;
			if ( is_string( $preset ) && in_array( $preset, $allowed, true ) ) {
				return $preset;
			}
			return isset( $allowed[0] ) ? $allowed[0] : '';
		}

		$value = sanitize_text_field( (string) $raw );
		if ( ! in_array( $value, $allowed, true ) ) {
			return new WP_Error(
				'invalid_input',
				sprintf(
					/* translators: %s: filter label */
					__( 'Invalid value for "%s".', 'napnox-prompts' ),
					isset( $filter['label'] ) ? $filter['label'] : $filter['id']
				),
				array( 'status' => 400 )
			);
		}
		return $value;
	}

	/**
	 * Compose the prompt sent to Gemini.
	 *
	 * A chosen category uses its own original template, so all the existing
	 * prompt engineering is preserved verbatim. "Auto-detect" uses the master
	 * template. Detail level, extra context and any reference image are
	 * appended as additional requirements in both cases.
	 *
	 * @param array $input Validated input from self::validate().
	 * @return string
	 */
	public static function build_prompt( $input ) {
		$category = $input['category'];
		$detail   = $input['detail'];

		if ( $category ) {
			$replacements = array(
				'{{numVariations}}' => (string) $input['numVariations'],
				'{{platform}}'      => $input['platform']['label'],
				'{{subtype}}'       => $input['subtype'],
				'{{inputText}}'     => $input['idea'],
			);
			foreach ( $input['filters'] as $id => $value ) {
				if ( is_bool( $value ) ) {
					$value = $value ? 'true' : 'false';
				}
				$replacements[ '{{' . $id . '}}' ] = (string) $value;
			}
			$composed = str_replace( array_keys( $replacements ), array_values( $replacements ), (string) $category['template'] );

			$extras = array( $detail['guidance'] );
			if ( '' !== $input['context'] ) {
				$extras[] = 'Extra context from the user: ' . $input['context'];
			}
			if ( $input['image'] ) {
				$extras[] = 'A reference image is attached. Study it and ground every prompt in what it actually shows.';
			}

			return $composed . "\n\nADDITIONAL REQUIREMENTS\n- " . implode( "\n- ", $extras );
		}

		$master   = NapNox_Config::master();
		$auto     = NapNox_Config::auto();
		$template = isset( $master['masterTemplate'] ) ? (string) $master['masterTemplate'] : '';

		$replacements = array(
			'{{inputText}}'        => $input['idea'],
			'{{promptType}}'       => isset( $auto['label'] ) ? $auto['label'] : 'Auto-detect',
			'{{platform}}'         => 'auto' === $input['platform']['value'] ? 'any modern AI tool' : $input['platform']['label'],
			'{{detail}}'           => $detail['label'],
			'{{numVariations}}'    => (string) $input['numVariations'],
			'{{typeGuidance}}'     => isset( $auto['guidance'] ) ? $auto['guidance'] : '',
			'{{platformGuidance}}' => isset( $input['platform']['guidance'] ) ? $input['platform']['guidance'] : '',
			'{{detailGuidance}}'   => $detail['guidance'],
			'{{extraContext}}'     => '' !== $input['context'] ? '- Extra context from the user: ' . $input['context'] . "\n" : '',
			'{{imageNote}}'        => $input['image'] ? "- A reference image is attached. Study it and ground every prompt in what it actually shows.\n" : '',
		);

		return str_replace( array_keys( $replacements ), array_values( $replacements ), $template );
	}

	/**
	 * The JSON schema Gemini must answer with.
	 *
	 * @return array
	 */
	private static function response_schema() {
		return array(
			'type'       => 'OBJECT',
			'required'   => array( 'prompts' ),
			'properties' => array(
				'prompts' => array(
					'type'  => 'ARRAY',
					'items' => array(
						'type'       => 'OBJECT',
						'required'   => array( 'prompt_text', 'tags' ),
						'properties' => array(
							'prompt_text' => array( 'type' => 'STRING' ),
							'tags'        => array(
								'type'  => 'ARRAY',
								'items' => array( 'type' => 'STRING' ),
							),
						),
					),
				),
			),
		);
	}

	/**
	 * Call Gemini, retrying transient failures with exponential backoff.
	 *
	 * @param array $input Validated input.
	 * @return array|WP_Error Array of prompts, each with 'text' and 'tags'.
	 */
	public static function generate( $input ) {
		$api_key = NapNox_Config::api_key();
		if ( ! $api_key ) {
			return new WP_Error(
				'not_configured',
				__( 'The prompt service is not configured yet. Please contact the site administrator.', 'napnox-prompts' ),
				array( 'status' => 503 )
			);
		}

		$master = NapNox_Config::master();
		$model  = isset( $master['model'] ) ? $master['model'] : 'gemini-2.5-flash';

		$parts = array( array( 'text' => self::build_prompt( $input ) ) );
		if ( $input['image'] ) {
			$parts[] = array(
				'inline_data' => array(
					'mime_type' => $input['image']['mimeType'],
					'data'      => $input['image']['base64'],
				),
			);
		}

		$payload = array(
			'contents'         => array( array( 'parts' => $parts ) ),
			'generationConfig' => array(
				'responseMimeType' => 'application/json',
				'responseSchema'   => self::response_schema(),
			),
		);

		$url        = self::ENDPOINT . rawurlencode( $model ) . ':generateContent';
		$last_error = null;

		for ( $attempt = 1; $attempt <= self::MAX_ATTEMPTS; $attempt++ ) {
			$response = wp_remote_post(
				$url,
				array(
					'timeout' => self::TIMEOUT,
					'headers' => array(
						'Content-Type'   => 'application/json',
						'x-goog-api-key' => $api_key,
					),
					'body'    => wp_json_encode( $payload ),
				)
			);

			if ( is_wp_error( $response ) ) {
				$last_error = new WP_Error(
					'upstream_error',
					__( 'Could not reach the prompt service. Please try again.', 'napnox-prompts' ),
					array( 'status' => 502 )
				);
				self::log( 'Transport error: ' . $response->get_error_message() );
			} else {
				$code = (int) wp_remote_retrieve_response_code( $response );
				$body = wp_remote_retrieve_body( $response );

				if ( 200 === $code ) {
					$prompts = self::parse( $body );
					if ( ! is_wp_error( $prompts ) ) {
						return $prompts;
					}
					$last_error = $prompts;
					self::log( 'Parse failure: ' . $prompts->get_error_message() );
				} else {
					$last_error = self::describe_error( $code, $body );
					self::log( 'HTTP ' . $code . ': ' . substr( (string) $body, 0, 500 ) );

					// Client errors other than rate limiting will not improve on retry.
					if ( 429 !== $code && $code < 500 ) {
						return $last_error;
					}
				}
			}

			if ( $attempt < self::MAX_ATTEMPTS ) {
				// 0.6s, then 1.2s.
				usleep( 600000 * $attempt );
			}
		}

		return $last_error ? $last_error : new WP_Error(
			'upstream_error',
			__( 'Could not generate prompts just now. Please try again in a moment.', 'napnox-prompts' ),
			array( 'status' => 502 )
		);
	}

	/**
	 * Turn an upstream status code into safe, user-facing copy.
	 *
	 * Full detail is written to the error log; the browser never sees it.
	 *
	 * @param int    $code HTTP status from Gemini.
	 * @param string $body Response body.
	 * @return WP_Error
	 */
	private static function describe_error( $code, $body ) {
		if ( 429 === $code ) {
			return new WP_Error(
				'upstream_error',
				__( 'The prompt service is busy right now. Please wait a moment and try again.', 'napnox-prompts' ),
				array( 'status' => 429 )
			);
		}
		if ( in_array( $code, array( 401, 403 ), true ) ) {
			return new WP_Error(
				'not_configured',
				__( 'The prompt service is not configured correctly. Please contact the site administrator.', 'napnox-prompts' ),
				array( 'status' => 502 )
			);
		}
		if ( 400 === $code && false !== stripos( (string) $body, 'safety' ) ) {
			return new WP_Error(
				'blocked',
				__( 'That idea was blocked by the content filter. Try rewording it.', 'napnox-prompts' ),
				array( 'status' => 422 )
			);
		}
		return new WP_Error(
			'upstream_error',
			__( 'Could not generate prompts just now. Please try again in a moment.', 'napnox-prompts' ),
			array( 'status' => 502 )
		);
	}

	/**
	 * Extract the prompt list from a Gemini response body.
	 *
	 * Tolerant of code fences and stray prose around the JSON.
	 *
	 * @param string $body Raw response body.
	 * @return array|WP_Error
	 */
	private static function parse( $body ) {
		$decoded = json_decode( (string) $body, true );
		$text    = isset( $decoded['candidates'][0]['content']['parts'][0]['text'] )
			? (string) $decoded['candidates'][0]['content']['parts'][0]['text']
			: '';

		if ( '' === trim( $text ) ) {
			$reason = isset( $decoded['candidates'][0]['finishReason'] ) ? $decoded['candidates'][0]['finishReason'] : '';
			if ( 'SAFETY' === $reason || 'RECITATION' === $reason ) {
				return new WP_Error(
					'blocked',
					__( 'That idea was blocked by the content filter. Try rewording it.', 'napnox-prompts' ),
					array( 'status' => 422 )
				);
			}
			return new WP_Error( 'upstream_error', __( 'The model returned an empty response.', 'napnox-prompts' ), array( 'status' => 502 ) );
		}

		$candidates = array( trim( $text ) );

		$stripped = preg_replace( '/^```(?:json)?\s*/i', '', trim( $text ) );
		$stripped = preg_replace( '/\s*```$/', '', (string) $stripped );
		$candidates[] = (string) $stripped;

		$start = strpos( $text, '{' );
		$end   = strrpos( $text, '}' );
		if ( false !== $start && false !== $end && $end > $start ) {
			$candidates[] = substr( $text, $start, $end - $start + 1 );
		}

		foreach ( $candidates as $candidate ) {
			$parsed = json_decode( $candidate, true );
			if ( ! is_array( $parsed ) || empty( $parsed['prompts'] ) || ! is_array( $parsed['prompts'] ) ) {
				continue;
			}

			$out = array();
			foreach ( $parsed['prompts'] as $prompt ) {
				if ( empty( $prompt['prompt_text'] ) || ! is_string( $prompt['prompt_text'] ) ) {
					continue;
				}
				$tags = array();
				if ( ! empty( $prompt['tags'] ) && is_array( $prompt['tags'] ) ) {
					foreach ( array_slice( $prompt['tags'], 0, 6 ) as $tag ) {
						if ( is_string( $tag ) ) {
							$tags[] = sanitize_text_field( $tag );
						}
					}
				}
				$out[] = array(
					'text' => trim( $prompt['prompt_text'] ),
					'tags' => $tags,
				);
			}

			if ( $out ) {
				return $out;
			}
		}

		return new WP_Error( 'upstream_error', __( 'The model returned a malformed response.', 'napnox-prompts' ), array( 'status' => 502 ) );
	}

	/**
	 * Write a diagnostic line to the PHP error log when debugging is on.
	 *
	 * @param string $message Message.
	 * @return void
	 */
	private static function log( $message ) {
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( '[NapNox] ' . $message ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Intentional diagnostic.
		}
	}
}
