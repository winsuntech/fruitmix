#coding=utf-8
import requests
url = 'http://localhost/files/854237a4-3582-48c1-8420-4536fa4263c7'
files = {'file': open('/trynode/ts.js', 'rb')}
r = requests.post(url, files=files)
print r.url,r.text