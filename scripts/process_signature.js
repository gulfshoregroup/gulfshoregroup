// Usage: node scripts/process_signature.js <input-image>
// Rotates the vertical signature photo, removes grey paper background,
// trims empty space and saves public/imgs/broker-signature.png
const sharp = require("sharp");
const path = require("path");

const input = process.argv[2] || path.join(__dirname, "..", "public", "imgs", "signature-raw.jpg");
const output = path.join(__dirname, "..", "public", "imgs", "broker-signature.png");
const ROTATE = Number(process.argv[3] ?? -90); // -90 = counter-clockwise
const THRESHOLD = 110; // pixels darker than this = ink

(async () => {
	const meta = await sharp(input).metadata();
	const inset = Math.round(Math.min(meta.width, meta.height) * 0.04);
	const { data, info } = await sharp(input)
		.extract({ left: inset, top: inset, width: meta.width - inset * 2, height: meta.height - inset * 2 })
		.rotate(ROTATE)
		.grayscale()
		.normalize()
		.raw()
		.toBuffer({ resolveWithObject: true });

	const rgba = Buffer.alloc(info.width * info.height * 4);
	for (let i = 0; i < info.width * info.height; i++) {
		const v = data[i];
		rgba[i * 4] = 10;
		rgba[i * 4 + 1] = 20;
		rgba[i * 4 + 2] = 60; // dark ink blue/black
		rgba[i * 4 + 3] = v < THRESHOLD ? 255 : 0;
	}

	await sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
		.trim()
		.resize({ width: 600, withoutEnlargement: false })
		.png()
		.toFile(output);

	console.log("✅ Saved:", output);
})().catch((e) => {
	console.error("❌", e.message);
	process.exit(1);
});
