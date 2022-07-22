/* MagicMirror²
 * Node Helper: MMM-MusicButler
 *
 * By jrettsch based on default newsfeed module
 * MIT Licensed.
 */

const NodeHelper = require("node_helper");
const MusicButlerFetcher = require("./MMM-MusicButlerFetcher.js");
const Log = require("logger");

module.exports = NodeHelper.create({

	// Override start method.
	start: function () {
		Log.log("Starting node helper for: " + this.name);
		this.fetchers = [];
	},

	// Override socketNotificationReceived received.
	socketNotificationReceived: function (notification, payload) {
		if (notification === "MUSICBUTLER_ADD_FEED") {
			this.createFetcher(payload.config);
		}
	},

	/**
	 * Creates a fetcher for a new feed if it doesn't exist yet.
	 * Otherwise it reuses the existing one.
	 *
	 * @param {object} feed The feed object
	 * @param {object} config The configuration object
	 */

	createFetcher: function (config) {
		const url = "https://www.musicbutler.io/users/feeds/" + config.feedToken + "/" || "";
		const encoding = config.encoding || "UTF-8";
		const reloadInterval = config.reloadInterval || 60 * 60 * 1000;
		const albumArtSize = config.albumArtSize || 300;

		try {
			new URL(url);
		} catch (error) {
			Log.error("MusicButler Error. Malformed feed url: ", url, error);
			this.sendSocketNotification("MUSICBUTLER_ERROR", { error_type: "MODULE_ERROR_MALFORMED_URL" });
			return;
		}

		let fetcher;
		if (typeof this.fetchers[url] === "undefined") {
			Log.log("Create new fetcher for url: " + url + " - Interval: " + reloadInterval);
			fetcher = new MusicButlerFetcher(url, reloadInterval, encoding, config.logFeedWarnings, albumArtSize);

			fetcher.onReceive(() => {
				this.broadcastFeeds();
			});

			fetcher.onError((fetcher, error) => {
				Log.error("MusicButler Error. Could not fetch feed: ", url, error);
				let error_type = NodeHelper.checkFetchError(error);
				this.sendSocketNotification("MUSICBUTLER_ERROR", {
					error_type
				});
			});

			this.fetchers[url] = fetcher;
		} else {
			Log.log("Use existing fetcher for url: " + url);
			fetcher = this.fetchers[url];
			fetcher.setReloadInterval(reloadInterval);
			fetcher.broadcastItems();
		}

		fetcher.startFetch();
	},

	/**
	 * Creates an object with all feed items of the different registered feeds,
	 * and broadcasts these using sendSocketNotification.
	 */
	broadcastFeeds: function () {
		const feeds = {};
		for (let f in this.fetchers) {
			feeds[f] = this.fetchers[f].items();
		}
		this.sendSocketNotification("RELEASE_ITEMS", feeds);
	}
});
