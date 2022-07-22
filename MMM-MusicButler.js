/* MagicMirror²
 * Module: MMM-MusicButler
 *
 * By jrettsch based on default newsfeed module
 * MIT Licensed.
 */
Module.register("MMM-MusicButler", {
	// Default module config.
	defaults: {
		feedToken: "",
		encoding: "UTF-8",
		showAsList: false,
		showPublishDate: true,
		showAlbumArt: false,
		albumArtSize: 300,
		publishDateFormat: "MMM Do",
		broadcastNewsFeeds: true,
		broadcastReleasesUpdates: true,
		showTitleAsUrl: false,
		wrapTitle: true,
		hideLoading: false,
		reloadInterval: 60 * 60 * 1000,
		updateInterval: 10 * 1000,
		animationSpeed: 2.5 * 1000,
		maxNewsItems: 0,
		ignoreOldItems: false,
		ignoreOlderThan: 7 * 24 * 60 * 60 * 1000,
		logFeedWarnings: false,
		dangerouslyDisableAutoEscaping: false
	},

	//Define required styles.
	getStyles: function () {
		return ["MMM-MusicButler.css"];
	},

	// Define required scripts.
	getScripts: function () {
		return ["moment.js"];
	},

	// Define required translations.
	getTranslations: function () {
		// The translations for the default modules are defined in the core translation files.
		// Therefor we can just return false. Otherwise we should have returned a dictionary.
		// If you're trying to build your own module including translations, check out the documentation.
		return false;
	},

	// Define start sequence.
	start: function () {
		Log.info("Starting module: " + this.name);

		// Set locale.
		moment.locale(config.language);

		this.newsItems = [];
		this.loaded = false;
		this.error = null;
		this.activeItem = 0;
		this.scrollPosition = 0;

		this.registerFeed();

	},

	// Override socket notification handler.
	socketNotificationReceived: function (notification, payload) {
		if (notification === "RELEASE_ITEMS") {
			this.generateFeed(payload);

			if (!this.loaded) {
				if (this.config.hideLoading) {
					this.show();
				}
				this.scheduleUpdateInterval();
			}

			this.loaded = true;
			this.error = null;
		} else if (notification === "MUSICBUTLER_ERROR") {
			this.error = this.translate(payload.error_type);
			this.scheduleUpdateInterval();
		}
	},

	//Override fetching of template name
	getTemplate: function () {
		return "MMM-MusicButler.njk";
	},

	//Override template data and return whats used for the current template
	getTemplateData: function () {
		if (this.error) {
			return {
				error: this.error
			};
		}
		if (this.newsItems.length === 0) {
			return {
				empty: true
			};
		}
		if (this.activeItem >= this.newsItems.length) {
			this.activeItem = 0;
		}

		const item = this.newsItems[this.activeItem];
		const items = this.newsItems.map(function (item) {
			item.publishDate = moment(item.pubdate).format(config.publishDateFormat);
			return item;
		});

		return {
			loaded: true,
			config: this.config,
			publishDate: moment(item.pubdate).format(this.config.publishDateFormat),
			title: item.title,
			url: item.url,
			imgurl: item.imgurl,
			items: items
		};
	},

	getActiveItemURL: function () {
		return typeof this.newsItems[this.activeItem].url === "string" ? this.newsItems[this.activeItem].url : this.newsItems[this.activeItem].url.href;
	},

	/**
	 * Registers the feeds to be used by the backend.
	 */
	registerFeed: function () {
		this.sendSocketNotification("MUSICBUTLER_ADD_FEED", {
			config: this.config
		});
	},

	/**
	 * Generate an ordered list of items for this configured module.
	 *
	 * @param {object} feeds An object with feeds returned by the node helper.
	 */
	generateFeed: function (feeds) {
		let newsItems = [];
		for (let feed in feeds) {
			const feedItems = feeds[feed];
			for (let item of feedItems) {
				if (!(this.config.ignoreOldItems && Date.now() - new Date(item.pubdate) > this.config.ignoreOlderThan)) {
					newsItems.push(item);
				}
			}
		}
		newsItems.sort(function (a, b) {
			const dateA = new Date(a.pubdate);
			const dateB = new Date(b.pubdate);
			return dateB - dateA;
		});

		if (this.config.maxNewsItems > 0) {
			newsItems = newsItems.slice(0, this.config.maxNewsItems);
		}

		// get updated news items and broadcast them
		const updatedItems = [];
		newsItems.forEach((value) => {
			if (this.newsItems.findIndex((value1) => value1 === value) === -1) {
				// Add item to updated items list
				updatedItems.push(value);
			}
		});

		// check if updated items exist, if so and if we should broadcast these updates, then lets do so
		if (this.config.broadcastReleasesUpdates && updatedItems.length > 0) {
			this.sendNotification("MUSICBUTLER_UPDATE", { items: updatedItems });
		}

		this.newsItems = newsItems;
	},

	/**
	 * Schedule visual update.
	 */
	scheduleUpdateInterval: function () {
		this.updateDom(this.config.animationSpeed);

		// Broadcast Release if needed
		if (this.config.broadcastReleases) {
			this.sendNotification("MUSICBUTLER", { items: this.newsItems });
		}

		// #2638 Clear timer if it already exists
		if (this.timer) clearInterval(this.timer);

		this.timer = setInterval(() => {
			this.activeItem++;
			this.updateDom(this.config.animationSpeed);

			// Broadcast Release if needed
			if (this.config.broadcastReleases) {
				this.sendNotification("MUSICBUTLER", { items: this.newsItems });
			}
		}, this.config.updateInterval);
	},

	resetTimer: function () {
		this.scrollPosition = 0;
		// reset bottom bar alignment
		if (!this.timer) {
			this.scheduleUpdateInterval();
		}
	},

	notificationReceived: function (notification, payload, sender) {
		const before = this.activeItem;
		if (notification === "MODULE_DOM_CREATED" && this.config.hideLoading) {
			this.hide();
		} else if (notification === "RELEASE_NEXT") {
			this.activeItem++;
			if (this.activeItem >= this.newsItems.length) {
				this.activeItem = 0;
			}
			this.resetTimer();
			Log.debug(this.name + " - going from RELEASE #" + before + " to #" + this.activeItem + " (of " + this.newsItems.length + ")");
			this.updateDom(100);
		} else if (notification === "RELEASE_PREVIOUS") {
			this.activeItem--;
			if (this.activeItem < 0) {
				this.activeItem = this.newsItems.length - 1;
			}
			this.resetTimer();
			Log.debug(this.name + " - going from RELEASE #" + before + " to #" + this.activeItem + " (of " + this.newsItems.length + ")");
			this.updateDom(100);
		} else if (notification === "RELEASE_INFO_REQUEST") {
			this.sendNotification("RELEASE_INFO_RESPONSE", {
				title: this.newsItems[this.activeItem].title,
				date: this.newsItems[this.activeItem].pubdate,
				url: this.getActiveItemURL()
			});
		}
	}
});
