const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio')
const cron = require('node-cron');

const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, './public'));
app.use(express.static(path.join(__dirname, './public')));

const port = 3000;
const  url = 'https://api.apify.com/v2/key-value-stores/Eb694wt67UxjdSGbc/records/LATEST?disableRedirect=true';

/* fetch new cases from file */
const data = fs.readFileSync('cases', 'utf8');
const dataString = data.toString().replace(/\n|\r|\s+/g, "");
const {yesterday, today: todayFromFile} = JSON.parse(dataString);

/* today's case calculatio */
const newcases = todayFromFile - yesterday;

app.get('/', (req, res) =>{
	axios.get(url)
	.then(dataset => {
   		const {infected, recovered, deceased} = dataset.data;
		res.render('chart', {infected, recovered, deceased, newcases});
	})
});

async function fetchHTML(url) {
	const { data } = await axios.get(url)
	return data;
}

const url2 = "https://covid19.ncdc.gov.ng";
const selector = "body div.pcoded-main-container div.card.bg-c-blue.order-card div.card-body h2 span";

/*
cron.schedule("* * * * *", () => {
	console.log("Running...");
})
*/
app.get("/fetch", (req, res) => {
	fetchHTML(url2).then( data => {
       		const $ = cheerio.load(data)
        	const today = $(selector).text().replace(",", "");
        	// todayFromFile fetched above;
		if(today > todayFromFile){
		        const payload = '{"yesterday":"'+todayFromFile+'","today":"'+today+'"}';
        		fs.writeFile('cases', payload, 'utf8', err => {
	       	        	const feedback = (err)? err : "Cases updated!";
                		console.log(feedback);

				axios.post('https://hooks.slack.com/services/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', {text: '#COVID19Nigeria new cases updated!'}, {headers: {'Content-Type': 'application/json'}});

        		})
		} else { console.log("No new numbers yet"); }
		axios.post('https://hooks.slack.com/services/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', {text: 'No new #COVID19Nigeria numbers!'}, {headers: {
			'Content-Type': 'application/json'
			}}
		);
		res.end();

	})
})

app.listen(port, () => {
	console.log(`Listening on port ${port}...`);
});
