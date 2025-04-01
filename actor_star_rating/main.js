const Apify = require('apify');
const puppeteer = require('puppeteer');

Apify.main(async () => {
    const input = await Apify.getInput();
    const asin = input.asin;

    const starCounts = {};
    let total = 0;
    let sum = 0;

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    for (const [label, param] of Object.entries({
        "5": "five_star",
        "4": "four_star",
        "3": "three_star",
        "2": "two_star",
        "1": "one_star"
    })) {
        const url = `https://www.amazon.com/product-reviews/${asin}/ref=cm_cr_arp_d_viewopt_sr?ie=UTF8&formatType=current_format&filterByStar=${param}`;
        await page.goto(url, { waitUntil: 'networkidle2' });

        const countText = await page.evaluate(() => {
            const el = document.querySelector('.cr-filter-info-review-count');
            return el ? el.innerText : null;
        });

        const match = countText?.match(/([\d,]+)\s+global/);
        const count = match ? parseInt(match[1].replace(/,/g, '')) : 0;

        starCounts[label] = count;
        total += count;
        sum += count * parseInt(label);

        await Apify.utils.sleep(1000 + Math.random() * 1000); // throttling
    }

    const average = total ? (sum / total).toFixed(2) : null;

    await browser.close();

    await Apify.setValue('OUTPUT', {
        asin,
        starBreakdown: starCounts,
        totalReviewCount: total,
        calculatedAverageRating: average ? parseFloat(average) : null
    });
});
