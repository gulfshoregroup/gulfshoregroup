const fs = require('fs');
const https = require('https');

https.get('https://restcountries.com/v3.1/all?fields=name,idd,cca2,flag', (res) => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => {
    const countries = JSON.parse(data);
    let result = [];
    countries.forEach(c => {
      if (c.idd && c.idd.root) {
        let suffixes = c.idd.suffixes || [''];
        if (suffixes.length > 5) suffixes = ['']; // For US/CA, don't want all area codes, just root
        suffixes.forEach(s => {
          let code = c.idd.root + s;
          if (c.name.common === 'United States') { code = '+1'; } // override specific
          result.push({
            code: code,
            country: c.name.common,
            flag: c.flag || ''
          });
        });
      }
    });
    
    // De-duplicate based on code + country
    const unique = [];
    const seen = new Set();
    result.forEach(r => {
      // For +1 we have many countries like US, Canada. Let's just keep US/CA
      if (r.code === '+1' && !['United States', 'Canada'].includes(r.country)) return;

      const key = r.code + '-' + r.country;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(r);
      }
    });

    unique.sort((a,b) => a.country.localeCompare(b.country));

    const fileContent = "export const countryCodes = " + JSON.stringify(unique, null, 2) + ";";
    fs.writeFileSync('src/lib/countryCodes.ts', fileContent);
    console.log('Created src/lib/countryCodes.ts with ' + unique.length + ' countries.');
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
