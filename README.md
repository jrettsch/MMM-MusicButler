# MMM-MusicButler

This is a module for [MagicMirror²](https://github.com/MichMich/MagicMirror) to show new music releases.
You need to register a free account on [MusicButler](https://www.musicbutler.io/) and start tracking your favourite artists.
Under settings you can then find an RSS feed link like `https://www.musicbutler.io/users/feeds/aaaaaaaa-bbbb-cccc-dddd-dddddddddddd/`

## Installation

Navigate to your MagicMirror modules folder, clone the repository and run the npm install of dependencies:

```bash
cd ~/MagicMirror/modules/
git clone https://github.com/jrettsch/MMM-MusicButler.git
cd ~/MagicMirror/modules/MMM-MusicButler/
npm install --omit=dev
```

Then edit the config.js:

Sample config list view in top_left area:

```javascript
{
	module: "MMM-MusicButler",
	position: "top_left",
	header: "New Releases",
	config: {
		feedToken: "aaaaaaaa-bbbb-cccc-dddd-dddddddddddd", // replace with your token from the rss feed url
		showPublishDate: true,
		showAsList: true,
		animationSpeed: 0
	}
},
```

![](https://raw.githubusercontent.com/jrettsch/MMM-MusicButler/master/img/showAsList.png)

Sample config single view in bottom_center area:

```javascript
{
	module: "MMM-MusicButler",
	position: "bottom_center",
	config: {
		feedToken: "aaaaaaaa-bbbb-cccc-dddd-dddddddddddd", // replace with your token from the rss feed url
		showPublishDate: true,
		showAlbumArt: true,
		albumArtSize: 200
	}
},
```

![](https://raw.githubusercontent.com/jrettsch/MMM-MusicButler/master/img/showAlbumArt.png)

### Options

| Option                  | Description                                                                                                                             | Default                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| feedToken | Token from the musicbutler.io rss feed url |  |
| encoding | The encoding of the news feed. This property is optional. Possible values: `UTF-8`, `ISO-8859-1`, etc ... | `UTF-8` |
| showAsList | Display the news as a list. Possible values: `true` or `false` | `false` |
| showPublishDate | Display the publish date of a release. Possible values: `true` or `false` | `true` |
| showAlbumArt | Display the album art of a release, but not when showAsList is true. Possible values: `true` or `false` | `false` |
| albumArtSize | Size of the album art in pixel. Possible values: `1` - `...` (Number) | `300` |
| publishDateFormat | Format to use for the publish date. Possible values: See [Moment.js formats](https://momentjs.com/docs/#/parsing/string-format/) | `MMM Do` (e.g. Jan 18th) |
| broadcastNewsFeeds | Gives the ability to broadcast news feeds to all modules, by using sendNotification() when set to true, rather than sendSocketNotification() when false. Possible values: `true` or `false` | `true` |
| broadcastReleasesUpdates | Gives the ability to broadcast news feed updates to all modules. Possible values: `true` or `false` | `true` |
| showTitleAsUrl | The release will link to musicbutler.io for more information. Possible values: `true` or `false` | `false` |
| wrapTitle | Wrap the title of the item to multiple lines. Possible values: `true` or `false` | `true` |
| hideLoading | Hide module instead of showing LOADING status. Possible values: `true` or `false` | `false` |
| reloadInterval | How often does the content needs to be fetched? (Milliseconds) | `60 * 60 * 1000` (60 minutes) |
| updateInterval | How often do you want to display a new release? (Milliseconds) | `10 * 1000` (10 seconds) |
| animationSpeed | Speed of the update animation. (Milliseconds) Possible values: `0` - `5000` | `2.5 * 1000` (2.5 seconds) |
| maxNewsItems | Total amount of releases to cycle through. (`0` for unlimited) | `0` |
| ignoreOldItems | Ignore news items that are outdated. Possible values: `true` or `false` | `false` |
| ignoreOlderThan | How old should news items be before they are considered outdated? (Milliseconds) | `7 * 24 * 60 * 60 * 1000` (7 days) |
| logFeedWarnings | Log warnings when there is an error parsing a release. Possible values: `true` or `false` | `false` |
| dangerouslyDisableAutoEscaping | Disable escaping of possible dangerous characters in the title. Possible values: `true` or `false` | `false` |


### Interacting with the module
MagicMirror's notification mechanism allows to send notifications to the module. The following notifications are supported:

| Notification Identifier | Description |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RELEASE_NEXT            | Shows the next release |
| RELEASE_PREVIOUS        | Shows the previous release |
| RELEASE_INFO_REQUEST    | Causes newsfeed to respond with the notification RELEASE_INFO_RESPONSE, the payload of which provides the title, date and url of the current release. |

### Notifications sent by the module
MagicMirror's notification mechanism can also be used to send notifications from the current module to all other modules. The following notifications are broadcasted from this module:

| Notification Identifier | Description |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MUSICBUTLER             | Broadcast the current list of news items. |
| MUSICBUTLER_UPDATE      | Broadcasts the list of updates news items. |