CREATE TEMP FUNCTION
  getHrefs(html STRING,
    baseUrl STRING)
  RETURNS ARRAY<STRING>
  LANGUAGE js OPTIONS ( library=["gs://test-terra-scripts/get-hrefs.js"] ) AS """
return getHrefs(html, {baseUrl})
""";

SELECT getHrefs('<html><body><a href="hixus/get"></a></body></html>', 'https://github.com/')
