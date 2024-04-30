import { readFileSync, writeFileSync } from 'fs';
import puppeteer from 'puppeteer';
import { WebhookClient, EmbedBuilder } from 'discord.js';

const config = JSON.parse(readFileSync('config.json', 'utf-8'));
if (!config.webhookUrl)
    throw new Error('Missing webhook URL');

const oldIds = readFileSync('ids.txt', 'utf-8'), newIds = [];
const templateImage = readFileSync('image.txt', 'utf-8').substring(0, 50);
const webhookClient = new WebhookClient({ url: config.webhookUrl });

const browser = await puppeteer.launch();
const page = await browser.newPage();
page.setJavaScriptEnabled(true);

let searchOptions = Object.entries(config.searchOptions).map(([key, value]) => key + '=' + value).join('&');
await page.goto('https://gsaauctions.gov/auctions/auctions-list?page=1&size=50&searchType=ALL_WORDS&advanced=true&' + searchOptions, { waitUntil: 'networkidle0' });

let pageNumber = 1;
const messages = [];
while (true) {
    console.log('Page ' + pageNumber);

    const elements = await page.$$('div.item-search-result-wrapper');
    for (const element of elements) {
        const title = await element.$('header > div > div > h3 > a');
        const id = await title.evaluate(el => el.textContent);
        newIds.push(id);
        if (oldIds.includes(id)) {
            console.log('Skipping ' + id);
            continue;
        }
        console.log('Scraping ' + id);
        const url = await title.evaluate(el => el.href);

        let image = await (await element.$('div.usa-card__media > div.usa-card__img > img')).evaluate(el => el.src);
        image = image.substring(image.indexOf(',') + 1);
        const template = image.startsWith(templateImage);
        if (!template)
            writeFileSync('image.png', image, 'base64');

        const descriptionElement = await element.$('div.usa-card__body > div > ul');
        const name = (await (await descriptionElement.$('li.auction-name')).evaluate(el => el.textContent)).substring(10);
        const location = (await (await descriptionElement.$('li.auction-location')).evaluate(el => el.textContent)).substring(10);
        const bidders = (await (await descriptionElement.$('li:nth-child(4)')).evaluate(el => el.textContent)).substring(16);
        const currentBid = (await (await descriptionElement.$('li:nth-child(5)')).evaluate(el => el.textContent)).substring(13);
        let closing = (await (await descriptionElement.$('li:nth-child(3)')).evaluate(el => el.textContent)).substring(14);
        closing = closing.substring(0, closing.lastIndexOf(' '));
        closing = new Date(closing);

        const embed = new EmbedBuilder()
            .setTitle(name)
            .setDescription(`Location: ${location}\nClosing: ${closing.getMonth() + 1}/${closing.getDate()}/${closing.getFullYear()}\nBidders: ${bidders}\nCurrent Bid: ${currentBid}`)
            .setURL(url)
            .setColor('#0099ff');

        messages.push(webhookClient.send({
            content: '',
            username: config.username || 'GSA Auctions',
            avatarURL: config.avatarURL || 'https://www.netizen.net/media/gsa.jpeg',
            embeds: [embed],
            files: template ? [] : ['./image.png']
        }));
    }

    let showing = await (await page.$('div.show-count > span > strong')).evaluate(el => el.textContent);
    showing = parseInt(showing.substring(showing.lastIndexOf(' ') + 1));
    if (showing > pageNumber * 50) {
        pageNumber++;
        await (await page.$('button#next-page-button-top')).click();
        await page.waitForSelector('div.usa-card__media > div.usa-card__img > img', { visible: true });
    }
    else
        break;
}

await Promise.all(messages);

writeFileSync('ids.txt', newIds.join('\n'));

await page.close();
await browser.close();