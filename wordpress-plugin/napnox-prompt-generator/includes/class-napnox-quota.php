<?php
/**
 * Per-account generation quota.
 *
 * @package NapNox
 */

defined( 'ABSPATH' ) || exit;

/**
 * Tracks how many generations each registered user has spent.
 *
 * The count lives in WordPress user meta, keyed to the account - not a cookie
 * or localStorage - so clearing the browser, switching device or opening a
 * private window does not reset it.
 */
class NapNox_Quota {

	const META_USED      = '_napnox_prompts_used';
	const META_UNLIMITED = '_napnox_unlimited';

	/**
	 * Generations used by a user.
	 *
	 * @param int $user_id User ID.
	 * @return int
	 */
	public static function used( $user_id ) {
		return max( 0, (int) get_user_meta( $user_id, self::META_USED, true ) );
	}

	/**
	 * Whether a user has unlimited access.
	 *
	 * @param int $user_id User ID.
	 * @return bool
	 */
	public static function is_unlimited( $user_id ) {
		if ( (bool) get_user_meta( $user_id, self::META_UNLIMITED, true ) ) {
			return true;
		}

		/**
		 * Filters whether a user bypasses the free limit.
		 *
		 * Useful for granting unlimited access to a membership role, e.g.
		 * add_filter( 'napnox_user_is_unlimited', fn( $u, $id ) =>
		 *     $u || user_can( $id, 'premium_member' ), 10, 2 );
		 *
		 * @param bool $unlimited Current value.
		 * @param int  $user_id   User ID.
		 */
		return (bool) apply_filters( 'napnox_user_is_unlimited', false, $user_id );
	}

	/**
	 * Grant or revoke unlimited access.
	 *
	 * @param int  $user_id   User ID.
	 * @param bool $unlimited Whether to grant.
	 * @return void
	 */
	public static function set_unlimited( $user_id, $unlimited ) {
		if ( $unlimited ) {
			update_user_meta( $user_id, self::META_UNLIMITED, 1 );
		} else {
			delete_user_meta( $user_id, self::META_UNLIMITED );
		}
	}

	/**
	 * Reset a user's used count back to zero.
	 *
	 * @param int $user_id User ID.
	 * @return void
	 */
	public static function reset( $user_id ) {
		update_user_meta( $user_id, self::META_USED, 0 );
	}

	/**
	 * Charge one generation against a user's quota.
	 *
	 * @param int $user_id User ID.
	 * @return int New used count.
	 */
	public static function increment( $user_id ) {
		$used = self::used( $user_id ) + 1;
		update_user_meta( $user_id, self::META_USED, $used );
		return $used;
	}

	/**
	 * Whether the user may generate right now.
	 *
	 * @param int $user_id User ID.
	 * @return bool
	 */
	public static function can_generate( $user_id ) {
		if ( self::is_unlimited( $user_id ) ) {
			return true;
		}
		return self::used( $user_id ) < NapNox_Config::free_limit();
	}

	/**
	 * Quota snapshot for the API response.
	 *
	 * @param int $user_id User ID.
	 * @return array
	 */
	public static function snapshot( $user_id ) {
		$limit     = NapNox_Config::free_limit();
		$used      = self::used( $user_id );
		$unlimited = self::is_unlimited( $user_id );

		return array(
			'used'      => $used,
			'limit'     => $limit,
			'remaining' => $unlimited ? PHP_INT_MAX : max( 0, $limit - $used ),
			'unlimited' => $unlimited,
		);
	}
}
