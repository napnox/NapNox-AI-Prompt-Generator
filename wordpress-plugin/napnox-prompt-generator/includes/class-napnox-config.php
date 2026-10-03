<?php
/**
 * Plugin settings and the shared master prompt configuration.
 *
 * @package NapNox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Reads plugin options and `shared/master-config.json`.
 *
 * That JSON file is the single source of truth shared with the React client,
 * so the prompt template and option lists can never drift between the two.
 */
class NapNox_Config {

	const OPTION_KEY = 'napnox_settings';

	/**
	 * Cached master config.
	 *
	 * @var array|null
	 */
	private static $master = null;

	/**
	 * Default settings.
	 *
	 * @return array
	 */
	public static function defaults() {
		return array(
			'api_key'          => '',
			'free_limit'       => 10,
			'contact_email'    => get_option( 'admin_email' ),
			'contact_whatsapp' => '',
			'contact_message'  => __( 'Get in touch to unlock unlimited prompt generation on your account.', 'napnox-prompts' ),
		);
	}

	/**
	 * All settings, merged over the defaults.
	 *
	 * @return array
	 */
	public static function all() {
		$saved = get_option( self::OPTION_KEY, array() );
		if ( ! is_array( $saved ) ) {
			$saved = array();
		}
		return array_merge( self::defaults(), $saved );
	}

	/**
	 * A single setting.
	 *
	 * @param string $key     Setting name.
	 * @param mixed  $default Fallback value.
	 * @return mixed
	 */
	public static function get( $key, $default = '' ) {
		$all = self::all();
		return isset( $all[ $key ] ) && '' !== $all[ $key ] ? $all[ $key ] : $default;
	}

	/**
	 * The Gemini API key.
	 *
	 * Defining NAPNOX_GEMINI_API_KEY in wp-config.php takes precedence and is
	 * the more secure option, since the key then never touches the database.
	 *
	 * @return string
	 */
	public static function api_key() {
		if ( defined( 'NAPNOX_GEMINI_API_KEY' ) && NAPNOX_GEMINI_API_KEY ) {
			return (string) NAPNOX_GEMINI_API_KEY;
		}
		return (string) self::get( 'api_key', '' );
	}

	/**
	 * How many free generations each registered user gets.
	 *
	 * @return int
	 */
	public static function free_limit() {
		$limit = (int) self::get( 'free_limit', 10 );
		return $limit > 0 ? $limit : 10;
	}

	/**
	 * The shared master prompt configuration.
	 *
	 * @return array
	 */
	public static function master() {
		if ( null !== self::$master ) {
			return self::$master;
		}

		$path = NAPNOX_PLUGIN_DIR . 'shared/master-config.json';
		$raw  = file_exists( $path ) ? file_get_contents( $path ) : ''; // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Local bundled file.
		$data = $raw ? json_decode( $raw, true ) : null;

		self::$master = is_array( $data ) ? $data : array();
		return self::$master;
	}

	/**
	 * Look up an entry by its "value" key in one of the master config lists.
	 *
	 * @param string $list  List name, e.g. detailLevels.
	 * @param string $value Value to find.
	 * @return array|null
	 */
	public static function find( $list, $value ) {
		$master = self::master();
		if ( empty( $master[ $list ] ) || ! is_array( $master[ $list ] ) ) {
			return null;
		}
		foreach ( $master[ $list ] as $entry ) {
			if ( isset( $entry['value'] ) && $entry['value'] === $value ) {
				return $entry;
			}
		}
		return null;
	}

	/**
	 * A category definition by id, with all its original subtypes, filters,
	 * platform options and prompt template.
	 *
	 * @param string $id Category id.
	 * @return array|null
	 */
	public static function category( $id ) {
		$master = self::master();
		if ( empty( $master['categories'] ) || ! is_array( $master['categories'] ) ) {
			return null;
		}
		foreach ( $master['categories'] as $category ) {
			if ( isset( $category['id'] ) && $category['id'] === $id ) {
				return $category;
			}
		}
		return null;
	}

	/**
	 * The "Auto-detect" mode definition.
	 *
	 * @return array
	 */
	public static function auto() {
		$master = self::master();
		return isset( $master['auto'] ) && is_array( $master['auto'] ) ? $master['auto'] : array();
	}

	/**
	 * A numeric default from the master config.
	 *
	 * @param string $key     Key under "defaults".
	 * @param int    $default Fallback.
	 * @return int
	 */
	public static function master_default( $key, $default ) {
		$master = self::master();
		return isset( $master['defaults'][ $key ] ) ? (int) $master['defaults'][ $key ] : $default;
	}

	/**
	 * Contact details shown when a user runs out of free generations.
	 *
	 * @return array
	 */
	public static function contact() {
		return array(
			'email'    => (string) self::get( 'contact_email', get_option( 'admin_email' ) ),
			'whatsapp' => (string) self::get( 'contact_whatsapp', '' ),
			'message'  => (string) self::get( 'contact_message', '' ),
		);
	}
}
