<?php
/**
 * Admin settings, user quota controls and the Users list column.
 *
 * @package NapNox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Everything the site owner sees in wp-admin.
 */
class NapNox_Admin {

	/**
	 * Hook up the admin UI.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'add_settings_page' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_settings' ) );

		// Per-user quota controls on the profile screen.
		add_action( 'show_user_profile', array( __CLASS__, 'render_user_fields' ) );
		add_action( 'edit_user_profile', array( __CLASS__, 'render_user_fields' ) );
		add_action( 'edit_user_profile_update', array( __CLASS__, 'save_user_fields' ) );
		add_action( 'personal_options_update', array( __CLASS__, 'save_user_fields' ) );

		// "Prompts" column on the Users list.
		add_filter( 'manage_users_columns', array( __CLASS__, 'add_users_column' ) );
		add_filter( 'manage_users_custom_column', array( __CLASS__, 'render_users_column' ), 10, 3 );
	}

	/**
	 * Add the settings page.
	 *
	 * @return void
	 */
	public static function add_settings_page() {
		add_options_page(
			__( 'NapNox Prompts', 'napnox-prompts' ),
			__( 'NapNox Prompts', 'napnox-prompts' ),
			'manage_options',
			'napnox-prompts',
			array( __CLASS__, 'render_settings_page' )
		);
	}

	/**
	 * Register the settings and their sanitiser.
	 *
	 * @return void
	 */
	public static function register_settings() {
		register_setting(
			'napnox_settings_group',
			NapNox_Config::OPTION_KEY,
			array(
				'type'              => 'array',
				'sanitize_callback' => array( __CLASS__, 'sanitize_settings' ),
				'default'           => NapNox_Config::defaults(),
			)
		);
	}

	/**
	 * Sanitise submitted settings.
	 *
	 * @param array $input Raw input.
	 * @return array
	 */
	public static function sanitize_settings( $input ) {
		$existing = NapNox_Config::all();
		$input    = is_array( $input ) ? $input : array();

		$api_key = isset( $input['api_key'] ) ? trim( (string) $input['api_key'] ) : '';
		// An untouched password field submits the masked placeholder; keep the stored key.
		if ( '' === $api_key || self::MASK === $api_key ) {
			$api_key = isset( $existing['api_key'] ) ? $existing['api_key'] : '';
		}

		$limit = isset( $input['free_limit'] ) ? (int) $input['free_limit'] : 10;

		return array(
			'api_key'          => $api_key,
			'free_limit'       => $limit > 0 ? $limit : 10,
			'contact_email'    => isset( $input['contact_email'] ) ? sanitize_email( $input['contact_email'] ) : '',
			'contact_whatsapp' => isset( $input['contact_whatsapp'] ) ? preg_replace( '/[^0-9+]/', '', (string) $input['contact_whatsapp'] ) : '',
			'contact_message'  => isset( $input['contact_message'] ) ? sanitize_textarea_field( $input['contact_message'] ) : '',
		);
	}

	/**
	 * Placeholder shown instead of the saved API key.
	 */
	const MASK = '********';

	/**
	 * Render the settings page.
	 *
	 * @return void
	 */
	public static function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$settings     = NapNox_Config::all();
		$key_constant = defined( 'NAPNOX_GEMINI_API_KEY' ) && NAPNOX_GEMINI_API_KEY;
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'NapNox AI Prompt Generator', 'napnox-prompts' ); ?></h1>

			<p>
				<?php esc_html_e( 'Place the generator on any page or post with this shortcode:', 'napnox-prompts' ); ?>
				<code>[napnox_prompt_generator]</code>
			</p>

			<form method="post" action="options.php">
				<?php settings_fields( 'napnox_settings_group' ); ?>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row">
							<label for="napnox_api_key"><?php esc_html_e( 'Gemini API key', 'napnox-prompts' ); ?></label>
						</th>
						<td>
							<?php if ( $key_constant ) : ?>
								<p><strong><?php esc_html_e( 'Defined in wp-config.php.', 'napnox-prompts' ); ?></strong></p>
								<p class="description">
									<?php esc_html_e( 'NAPNOX_GEMINI_API_KEY is set, so this field is ignored. This is the most secure option.', 'napnox-prompts' ); ?>
								</p>
							<?php else : ?>
								<input
									type="password"
									id="napnox_api_key"
									name="<?php echo esc_attr( NapNox_Config::OPTION_KEY ); ?>[api_key]"
									value="<?php echo esc_attr( $settings['api_key'] ? self::MASK : '' ); ?>"
									class="regular-text"
									autocomplete="new-password"
								/>
								<p class="description">
									<?php
									printf(
										/* translators: %s: link to Google AI Studio */
										esc_html__( 'Get a key from %s. The key stays on your server and is never sent to visitors.', 'napnox-prompts' ),
										'<a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a>'
									);
									?>
								</p>
								<p class="description">
									<?php esc_html_e( 'More secure: add define( \'NAPNOX_GEMINI_API_KEY\', \'your-key\' ); to wp-config.php instead, so it never touches the database.', 'napnox-prompts' ); ?>
								</p>
							<?php endif; ?>
						</td>
					</tr>

					<tr>
						<th scope="row">
							<label for="napnox_free_limit"><?php esc_html_e( 'Free generations per user', 'napnox-prompts' ); ?></label>
						</th>
						<td>
							<input
								type="number"
								min="1"
								step="1"
								id="napnox_free_limit"
								name="<?php echo esc_attr( NapNox_Config::OPTION_KEY ); ?>[free_limit]"
								value="<?php echo esc_attr( $settings['free_limit'] ); ?>"
								class="small-text"
							/>
							<p class="description">
								<?php esc_html_e( 'Counted per registered account, not per browser. Users must be logged in to generate at all.', 'napnox-prompts' ); ?>
							</p>
						</td>
					</tr>

					<tr>
						<th scope="row">
							<label for="napnox_contact_email"><?php esc_html_e( 'Contact email', 'napnox-prompts' ); ?></label>
						</th>
						<td>
							<input
								type="email"
								id="napnox_contact_email"
								name="<?php echo esc_attr( NapNox_Config::OPTION_KEY ); ?>[contact_email]"
								value="<?php echo esc_attr( $settings['contact_email'] ); ?>"
								class="regular-text"
							/>
							<p class="description"><?php esc_html_e( 'Shown to users who run out of free generations. Leave blank to hide the email button.', 'napnox-prompts' ); ?></p>
						</td>
					</tr>

					<tr>
						<th scope="row">
							<label for="napnox_contact_whatsapp"><?php esc_html_e( 'WhatsApp number', 'napnox-prompts' ); ?></label>
						</th>
						<td>
							<input
								type="text"
								id="napnox_contact_whatsapp"
								name="<?php echo esc_attr( NapNox_Config::OPTION_KEY ); ?>[contact_whatsapp]"
								value="<?php echo esc_attr( $settings['contact_whatsapp'] ); ?>"
								class="regular-text"
								placeholder="+923001234567"
							/>
							<p class="description"><?php esc_html_e( 'Full international format. Leave blank to hide the WhatsApp button.', 'napnox-prompts' ); ?></p>
						</td>
					</tr>

					<tr>
						<th scope="row">
							<label for="napnox_contact_message"><?php esc_html_e( 'Upgrade message', 'napnox-prompts' ); ?></label>
						</th>
						<td>
							<textarea
								id="napnox_contact_message"
								name="<?php echo esc_attr( NapNox_Config::OPTION_KEY ); ?>[contact_message]"
								rows="3"
								class="large-text"
							><?php echo esc_textarea( $settings['contact_message'] ); ?></textarea>
						</td>
					</tr>
				</table>

				<?php submit_button(); ?>
			</form>

			<hr />
			<h2><?php esc_html_e( 'Granting unlimited access', 'napnox-prompts' ); ?></h2>
			<p>
				<?php esc_html_e( 'When a member contacts you after using their free generations, open Users, edit that member, and tick "Unlimited prompt generations". You can also reset their counter from the same screen.', 'napnox-prompts' ); ?>
			</p>
		</div>
		<?php
	}

	/**
	 * Quota controls on the user profile screen.
	 *
	 * @param WP_User $user User being edited.
	 * @return void
	 */
	public static function render_user_fields( $user ) {
		$is_admin  = current_user_can( 'edit_users' );
		$snapshot  = NapNox_Quota::snapshot( $user->ID );
		$unlimited = $snapshot['unlimited'];
		?>
		<h2><?php esc_html_e( 'NapNox Prompt Generator', 'napnox-prompts' ); ?></h2>
		<?php if ( $is_admin ) { wp_nonce_field( 'napnox_user_quota', 'napnox_user_quota_nonce' ); } ?>
		<table class="form-table" role="presentation">
			<tr>
				<th scope="row"><?php esc_html_e( 'Generations used', 'napnox-prompts' ); ?></th>
				<td>
					<p>
						<?php
						if ( $unlimited ) {
							printf(
								/* translators: %d: generations used */
								esc_html__( '%d used — unlimited access', 'napnox-prompts' ),
								(int) $snapshot['used']
							);
						} else {
							printf(
								/* translators: 1: used, 2: limit */
								esc_html__( '%1$d of %2$d free generations used', 'napnox-prompts' ),
								(int) $snapshot['used'],
								(int) $snapshot['limit']
							);
						}
						?>
					</p>
				</td>
			</tr>
			<?php if ( $is_admin ) : ?>
				<tr>
					<th scope="row"><?php esc_html_e( 'Unlimited access', 'napnox-prompts' ); ?></th>
					<td>
						<label>
							<input
								type="checkbox"
								name="napnox_unlimited"
								value="1"
								<?php checked( (bool) get_user_meta( $user->ID, NapNox_Quota::META_UNLIMITED, true ) ); ?>
							/>
							<?php esc_html_e( 'Unlimited prompt generations for this user', 'napnox-prompts' ); ?>
						</label>
					</td>
				</tr>
				<tr>
					<th scope="row"><?php esc_html_e( 'Reset counter', 'napnox-prompts' ); ?></th>
					<td>
						<label>
							<input type="checkbox" name="napnox_reset_usage" value="1" />
							<?php esc_html_e( 'Set this user\'s used count back to zero on save', 'napnox-prompts' ); ?>
						</label>
					</td>
				</tr>
			<?php endif; ?>
		</table>
		<?php
	}

	/**
	 * Persist the per-user quota controls.
	 *
	 * @param int $user_id User being saved.
	 * @return void
	 */
	public static function save_user_fields( $user_id ) {
		if ( ! current_user_can( 'edit_users' ) ) {
			return;
		}

		$nonce = isset( $_POST['napnox_user_quota_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['napnox_user_quota_nonce'] ) ) : '';
		if ( ! $nonce || ! wp_verify_nonce( $nonce, 'napnox_user_quota' ) ) {
			return;
		}

		NapNox_Quota::set_unlimited( $user_id, ! empty( $_POST['napnox_unlimited'] ) );

		if ( ! empty( $_POST['napnox_reset_usage'] ) ) {
			NapNox_Quota::reset( $user_id );
		}
	}

	/**
	 * Add the "Prompts" column to the Users list.
	 *
	 * @param array $columns Existing columns.
	 * @return array
	 */
	public static function add_users_column( $columns ) {
		$columns['napnox_prompts'] = __( 'Prompts', 'napnox-prompts' );
		return $columns;
	}

	/**
	 * Render the "Prompts" column.
	 *
	 * @param string $output      Current output.
	 * @param string $column_name Column being rendered.
	 * @param int    $user_id     User ID.
	 * @return string
	 */
	public static function render_users_column( $output, $column_name, $user_id ) {
		if ( 'napnox_prompts' !== $column_name ) {
			return $output;
		}

		$snapshot = NapNox_Quota::snapshot( $user_id );
		if ( $snapshot['unlimited'] ) {
			return '<span style="color:#5b21b6;font-weight:600">' . esc_html__( 'Unlimited', 'napnox-prompts' ) . '</span>';
		}

		$exhausted = $snapshot['used'] >= $snapshot['limit'];
		return sprintf(
			'<span style="color:%s">%d / %d</span>',
			$exhausted ? '#b91c1c' : '#374151',
			(int) $snapshot['used'],
			(int) $snapshot['limit']
		);
	}
}
