<?php
/**
 * Plugin Name:       NapNox AI Prompt Generator
 * Plugin URI:        https://napnox.com/
 * Description:       Master AI prompt generator for registered members. Logged-in users get 10 free generations, counted against their WordPress account; after that they contact you for unlimited access.
 * Version:           2.0.0
 * Requires at least: 5.8
 * Requires PHP:      7.4
 * Author:            NapNox
 * License:           GPL-2.0-or-later
 * Text Domain:       napnox-prompts
 *
 * @package NapNox
 */

defined( 'ABSPATH' ) || exit;

define( 'NAPNOX_VERSION', '2.0.0' );
define( 'NAPNOX_PLUGIN_FILE', __FILE__ );
define( 'NAPNOX_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'NAPNOX_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once NAPNOX_PLUGIN_DIR . 'includes/class-napnox-config.php';
require_once NAPNOX_PLUGIN_DIR . 'includes/class-napnox-quota.php';
require_once NAPNOX_PLUGIN_DIR . 'includes/class-napnox-gemini.php';
require_once NAPNOX_PLUGIN_DIR . 'includes/class-napnox-rest.php';
require_once NAPNOX_PLUGIN_DIR . 'includes/class-napnox-admin.php';

/**
 * Main plugin class: registers the shortcode and boots the sub-modules.
 */
final class NapNox_Prompt_Generator {

	/**
	 * Singleton instance.
	 *
	 * @var NapNox_Prompt_Generator|null
	 */
	private static $instance = null;

	/**
	 * Whether the shortcode has already rendered on this request.
	 *
	 * @var bool
	 */
	private $rendered = false;

	/**
	 * Boot the plugin.
	 *
	 * @return NapNox_Prompt_Generator
	 */
	public static function instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Hook everything up.
	 */
	private function __construct() {
		add_shortcode( 'napnox_prompt_generator', array( $this, 'render_shortcode' ) );
		add_action( 'rest_api_init', array( 'NapNox_REST', 'register_routes' ) );

		if ( is_admin() ) {
			NapNox_Admin::init();
		}
	}

	/**
	 * Register (but do not yet print) the front-end assets.
	 */
	private function register_assets() {
		$js  = NAPNOX_PLUGIN_DIR . 'assets/napnox-app.js';
		$css = NAPNOX_PLUGIN_DIR . 'assets/napnox-app.css';

		wp_register_style(
			'napnox-fonts',
			'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
			array(),
			null // phpcs:ignore WordPress.WP.EnqueuedResourceParameters.MissingVersion -- Google Fonts is versioned by URL.
		);

		wp_register_style(
			'napnox-app',
			NAPNOX_PLUGIN_URL . 'assets/napnox-app.css',
			array( 'napnox-fonts' ),
			file_exists( $css ) ? (string) filemtime( $css ) : NAPNOX_VERSION
		);

		wp_register_script(
			'napnox-app',
			NAPNOX_PLUGIN_URL . 'assets/napnox-app.js',
			array(),
			file_exists( $js ) ? (string) filemtime( $js ) : NAPNOX_VERSION,
			true
		);
	}

	/**
	 * Render the [napnox_prompt_generator] shortcode.
	 *
	 * @param array $atts Shortcode attributes.
	 * @return string
	 */
	public function render_shortcode( $atts = array() ) {
		$atts = shortcode_atts(
			array(
				'class' => '',
			),
			$atts,
			'napnox_prompt_generator'
		);

		if ( ! file_exists( NAPNOX_PLUGIN_DIR . 'assets/napnox-app.js' ) ) {
			if ( current_user_can( 'manage_options' ) ) {
				return '<div style="padding:1rem;border:1px solid #f0b429;background:#fffbeb;border-radius:8px">'
					. esc_html__( 'NapNox: the front-end bundle is missing. Run "npm run package:wp" and upload the built plugin.', 'napnox-prompts' )
					. '</div>';
			}
			return '';
		}

		$this->register_assets();
		wp_enqueue_style( 'napnox-app' );
		wp_enqueue_script( 'napnox-app' );

		// Inject the config once per page, before the bundle runs. Note we use
		// wp_add_inline_script rather than wp_localize_script because the
		// latter stringifies booleans and integers.
		if ( ! $this->rendered ) {
			$this->rendered = true;

			$config = array(
				'restUrl' => esc_url_raw( rest_url( NapNox_REST::NAMESPACE_V1 . '/' ) ),
				'nonce'   => wp_create_nonce( 'wp_rest' ),
				'session' => NapNox_REST::session_payload(),
			);

			wp_add_inline_script(
				'napnox-app',
				'window.NapNoxConfig = ' . wp_json_encode( $config ) . ';',
				'before'
			);
		}

		$classes = trim( 'napnox-app ' . sanitize_html_class( $atts['class'] ) );

		return sprintf(
			'<div class="%s" data-napnox-root></div>',
			esc_attr( $classes )
		);
	}
}

/**
 * Kick things off.
 */
function napnox_prompt_generator() {
	return NapNox_Prompt_Generator::instance();
}
add_action( 'plugins_loaded', 'napnox_prompt_generator' );

/**
 * Set sane defaults on activation.
 */
function napnox_activate() {
	$existing = get_option( NapNox_Config::OPTION_KEY );
	if ( ! is_array( $existing ) ) {
		add_option( NapNox_Config::OPTION_KEY, NapNox_Config::defaults() );
	}
}
register_activation_hook( __FILE__, 'napnox_activate' );
