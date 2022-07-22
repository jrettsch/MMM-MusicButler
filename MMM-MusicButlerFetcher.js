/* MagicMirror²
 * Node Helper: MMM-MusicButler - MMM-MusicButlerFetcher
 *
 * By jrettsch based on default newsfeed module
 * MIT Licensed.
 */
const Log = require("logger");
const FeedMe = require("feedme");
const NodeHelper = require("node_helper");
const fetch = require("fetch");
const iconv = require("iconv-lite");
const stream = require("stream");

/**
 * Responsible for requesting an update on the set interval and broadcasting the data.
 *
 * @param {string} url URL of the news feed.
 * @param {number} reloadInterval Reload interval in milliseconds.
 * @param {string} encoding Encoding of the feed.
 * @param {boolean} logFeedWarnings If true log warnings when there is an error parsing a news article.
 * @param {number} albumArtSize Size of the album art.
 * @class
 */
const MusicButlerFetcher = function (url, reloadInterval, encoding, logFeedWarnings, albumArtSize) {
	let reloadTimer = null;
	let items = [];

	let fetchFailedCallback = function () {};
	let itemsReceivedCallback = function () {};

	if (reloadInterval < 1000) {
		reloadInterval = 1000;
	}

	/* private methods */

	/**
	 * Request the new items.
	 */
	const fetchReleases = () => {
		clearTimeout(reloadTimer);
		reloadTimer = null;
		items = [];

		const parser = new FeedMe();

		parser.on("item", (item) => {
			const title = item.title.replaceAll("released","-").replaceAll('"','');
			const pubdate = item.pubdate || item.published || item.updated || item["dc:date"];
			const url = item.url || item.link || "";
			const imgurl = item.enclosure.url.replace("300x300bb",albumArtSize+"x"+albumArtSize+"bb") || "";

			if (title && pubdate) {
				items.push({
					title: title,
					pubdate: pubdate,
					url: url,
					imgurl: imgurl
				});
			} else if (logFeedWarnings) {
				Log.warn("Can't parse feed item:");
				Log.warn(item);
				Log.warn("Title: " + title);
				Log.warn("Pubdate: " + pubdate);
			}
		});

		parser.on("end", () => {
			this.broadcastItems();
			scheduleTimer();
		});

		parser.on("error", (error) => {
			fetchFailedCallback(this, error);
			scheduleTimer();
		});

		const nodeVersion = Number(process.version.match(/^v(\d+\.\d+)/)[1]);
		const headers = {
			"User-Agent": "Mozilla/5.0 (Node.js " + nodeVersion + ") MagicMirror/" + global.version,
			"Cache-Control": "max-age=0, no-cache, no-store, must-revalidate",
			Pragma: "no-cache"
		};

		fetch(url, { headers: headers })
			.then(NodeHelper.checkFetchStatus)
			.then((response) => {
				let nodeStream;
				if (response.body instanceof stream.Readable) {
					nodeStream = response.body;
				} else {
					nodeStream = stream.Readable.fromWeb(response.body);
				}
				nodeStream.pipe(iconv.decodeStream(encoding)).pipe(parser);
			})
			.catch((error) => {
				fetchFailedCallback(this, error);
				scheduleTimer();
			});
	};

	/**
	 * Schedule the timer for the next update.
	 */
	const scheduleTimer = function () {
		clearTimeout(reloadTimer);
		reloadTimer = setTimeout(function () {
			fetchReleases();
		}, reloadInterval);
	};

	/* public methods */

	/**
	 * Update the reload interval, but only if we need to increase the speed.
	 *
	 * @param {number} interval Interval for the update in milliseconds.
	 */
	this.setReloadInterval = function (interval) {
		if (interval > 1000 && interval < reloadInterval) {
			reloadInterval = interval;
		}
	};

	/**
	 * Initiate fetchReleases();
	 */
	this.startFetch = function () {
		fetchReleases();
	};

	/**
	 * Broadcast the existing items.
	 */
	this.broadcastItems = function () {
		if (items.length <= 0) {
			Log.info("MusicButler-Fetcher: No items to broadcast yet.");
			return;
		}
		Log.info("MusicButler-Fetcher: Broadcasting " + items.length + " items.");
		itemsReceivedCallback(this);
	};

	this.onReceive = function (callback) {
		itemsReceivedCallback = callback;
	};

	this.onError = function (callback) {
		fetchFailedCallback = callback;
	};

	this.url = function () {
		return url;
	};

	this.items = function () {
		return items;
	};
};

module.exports = MusicButlerFetcher;
