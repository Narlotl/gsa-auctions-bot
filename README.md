# gsa-auctions-bot
A Discord webhook to send messages of GSA Auctions listings.
## Getting started
- Clone the repo
- Run `npm install`
- Create a `config.json`
- Add a field for the `webhookUrl` and set it to your webhook's URL
- Add a field called `searchOptions` and set it to the URL queries
  - Don't set the `page`, `size`, `advanced`, or `searchType`
  - Go to the site and set your filters, then copy the query string
- Run `node index` every time you want to send the messages
- (Optional) add a `username` field for a custom bot name (default `GSA Auctions`)
- (Optional) add an `avatarUrl` field for a custom bot icon (default <img src="https://www.netizen.net/media/gsa.jpeg" style="width: 1em;">)
  - Discord doesn't allow local pictures, so it has to be a URL

### Example
Show all active listings in California
  ```json
  {
    "webhookUrl": "https://discord.com/api/webhooks/{webhook.id}/{webhook.token}",
    "searchOptions": {
      "status": "active",
      "states": "CA"
    }
  }
  ```
