<?php
/**
 * REST API routes.
 *
 * @package NapNox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Exposes napnox/v1/session and napnox/v1/generate.
 *
 * Authentication is plain WordPress cookie auth plus the standard REST nonce,
 * so whatever registration plugin you use, its users work here automatically.
 */
class NapNox_REST {

	const NAMESPACE_V1 = 'napnox/v1';

	/**
	 * Minimum seconds between two generations by the same user.
	 */
	const THROTTLE_SECONDS = 3;

	/**
	 * Register the routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			self::NAMESPACE_V1,
			'/session',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'handle_session' ),
				'permission_callback' => '__return_true',
			)
		);

		register_rest_route(
			self::NAMESPACE_V1,
			'/generate',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'handle_generate' ),
				'permission_callback' => array( __CLASS__, 'require_login' ),
			)
		);
	}

	/**
	 * Only signed-in, registered users may generate prompts.
	 *
	 * @return true|WP_Error
	 */
	public static function require_login() {
		if ( is_user_logged_in() ) {
			return true;
		}
		return new WP_Error(
			'not_logged_in',
			__( 'Please sign in to generate prompts.', 'napnox-prompts' ),
			array( 'status' => 401 )
		);
	}

	/**
	 * Current session, quota and contact details.
	 *
	 * Also inlined into the page by the shortcode so the first paint is correct.
	 *
	 * @return array
	 */
	public static function session_payload() {
		$logged_in = is_user_logged_in();
		$user      = $logged_in ? wp_get_current_user() : null;

		$payload = array(
			'loggedIn'    => $logged_in,
			'user'        => null,
			'usage'       => null,
			'loginUrl'    => wp_login_url( self::current_url() ),
			'registerUrl' => get_option( 'users_can_register' ) ? wp_registration_url() : '',
			'contact'     => NapNox_Config::contact(),
			// Pages served from a full-page cache can embed a stale nonce;
			// the client adopts this fresh one for subsequent requests.
			'nonce'       => wp_create_nonce( 'wp_rest' ),
		);

		/**
		 * Filters the login URL used by the generator's sign-in button.
		 *
		 * Point this at your registration plugin's custom login page, e.g.
		 * add_filter( 'napnox_login_url', fn() => home_url( '/login/' ) );
		 *
		 * @param string $url Default WordPress login URL.
		 */
		$payload['loginUrl'] = apply_filters( 'napnox_login_url', $payload['loginUrl'] );

		/**
		 * Filters the registration URL used by the generator.
		 *
		 * @param string $url Default WordPress registration URL.
		 */
		$payload['registerUrl'] = apply_filters( 'napnox_register_url', $payload['registerUrl'] );

		if ( $user ) {
			$payload['user']  = array(
				'name'  => $user->display_name ? $user->display_name : $user->user_login,
				'email' => $user->user_email,
			);
			$payload['usage'] = NapNox_Quota::snapshot( $user->ID );

			if ( current_user_can( 'manage_options' ) && ! NapNox_Config::api_key() ) {
				$payload['notice'] = __( 'Admin notice: no Gemini API key saved yet. Add one under Settings > NapNox Prompts.', 'napnox-prompts' );
			}
		}

		return $payload;
	}

	/**
	 * GET /napnox/v1/session
	 *
	 * @return WP_REST_Response
	 */
	public static function handle_session() {
		$response = rest_ensure_response( self::session_payload() );
		$response->header( 'Cache-Control', 'no-store, private' );
		return $response;
	}

	/**
	 * POST /napnox/v1/generate
	 *
	 * @param WP_REST_Request $request Request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function handle_generate( WP_REST_Request $request ) {
		$user_id = get_current_user_id();

		// 1. Quota, enforced against the account rather than the browser.
		if ( ! NapNox_Quota::can_generate( $user_id ) ) {
			$snapshot = NapNox_Quota::snapshot( $user_id );
			return new WP_Error(
				'limit_reached',
				sprintf(
					/* translators: %d: number of free generations */
					__( 'You have used all %d free generations. Contact us for unlimited access.', 'napnox-prompts' ),
					$snapshot['limit']
				),
				array(
					'status' => 402,
					'usage'  => $snapshot,
				)
			);
		}

		// 2. Light throttle so a stuck client cannot burn through the quota.
		$throttle_key = 'napnox_rl_' . $user_id;
		if ( get_transient( $throttle_key ) ) {
			return new WP_Error(
				'too_fast',
				__( 'Please wait a couple of seconds before generating again.', 'napnox-prompts' ),
				array( 'status' => 429 )
			);
		}
		set_transient( $throttle_key, 1, self::THROTTLE_SECONDS );

		// 3. Validate against the shared master config.
		$input = NapNox_Gemini::validate( (array) $request->get_json_params() );
		if ( is_wp_error( $input ) ) {
			delete_transient( $throttle_key );
			return $input;
		}

		// 4. Call Gemini.
		$prompts = NapNox_Gemini::generate( $input );
		delete_transient( $throttle_key );

		if ( is_wp_error( $prompts ) ) {
			return $prompts;
		}

		// 5. Only a successful generation is charged against the quota.
		NapNox_Quota::increment( $user_id );

		$now     = time();
		$payload = array(
			'requestId'   => 'gen-' . $now . '-' . $user_id,
			'generatedAt' => gmdate( 'c', $now ),
			'prompts'     => array(),
			'usage'       => NapNox_Quota::snapshot( $user_id ),
		);

		foreach ( $prompts as $index => $prompt ) {
			$payload['prompts'][] = array(
				'id'       => 'gen-' . $now . '-' . $index,
				'text'     => $prompt['text'],
				'metadata' => array( 'tags' => $prompt['tags'] ),
			);
		}

		/**
		 * Fires after a user successfully generates prompts.
		 *
		 * @param int   $user_id User ID.
		 * @param array $payload Response payload.
		 */
		do_action( 'napnox_prompts_generated', $user_id, $payload );

		$response = rest_ensure_response( $payload );
		$response->header( 'Cache-Control', 'no-store, private' );
		return $response;
	}

	/**
	 * Best-effort current page URL, used as the login redirect target.
	 *
	 * @return string
	 */
	private static function current_url() {
		$referer = wp_get_referer();
		if ( $referer ) {
			return $referer;
		}
		return home_url( '/' );
	}
}
