const express = require('express');
const https = require('https');
const port = 8070;
const app = express();

app.get('/', (req, res) => {
	var url = req.query.u;
	if (url === undefined) {
		if (req.query.t !== undefined && req.query.b !== undefined) {
			url = `https://build.appcenter.ms/v0.1/apps/${req.query.t}/branches/${req.query.b}/badge`;
		} else {
			res.status(400).send("Must provide token and branch name if no URL is given.");
			return;
		}
	}
	const extractedBranchName = /branches\/(.+)\/badge/g.exec(url)[1];
	const branchName = req.query.b !== undefined ? req.query.b : extractedBranchName !== undefined && extractedBranchName !== '' ? extractedBranchName : "unknown";
	const width = req.query.w !== undefined ? Number(req.query.w) : 100;
	const background = req.query.bg !== undefined ? req.query.bg : "AAA";
	const foreground = req.query.fg !== undefined ? req.query.fg : "FFF";
	https.get(url, response => {
		var badgeSvg = '';
		response.on('data', function (chunk) { badgeSvg += chunk; });
		response.on('end', function () {
			const badgeWidth = /svg.+width\s*=\s*"([\d\.]+)"/g.exec(badgeSvg)[1];
			const badgeHeight = /svg.+height\s*=\s*"([\d\.]+)"/g.exec(badgeSvg)[1];
			const cornerRadius = /rect.+rx\s*=\s*"([\d\.]+)"/g.exec(badgeSvg)[1];
			const overlap = req.query.o !== undefined ? Number(req.query.o) : cornerRadius * 2;
			const combinedWidth = width + badgeWidth;
			const overlappedWidth = width + overlap;
			var contents = `<svg width="${combinedWidth}" height="${badgeHeight}" xmlns="http://www.w3.org/2000/svg">
			<clipPath id="left_clip">
				<rect width="${overlappedWidth}" height="${badgeHeight}" rx="${cornerRadius}" />
			</clipPath>
			<g clip-path="url(#left_clip)">
				<rect width="${overlappedWidth}" height="${badgeHeight}" fill="#${background}" />
				<rect width="${overlappedWidth}" height="${badgeHeight}" fill="url(#a)" />
			</g>
			<g fill="#${foreground}" text-anchor="left" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
				<text x="8" y="15.0" fill="#000" fill-opacity="0.3">${branchName}</text>
				<text x="8" y="14.0" fill="#${foreground}">${branchName}</text>
			</g>
			<g transform="translate(${width},0)">${badgeSvg}</g>
		</svg>`;
			res.contentType("image/svg+xml; charset=utf-8; api-version=5.0-preview.1");
			res.send(contents);
		});
	});
});

app.listen(port, () => {
	console.log(`Server listening on port ${port}`);
})