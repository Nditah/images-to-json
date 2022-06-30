import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { print } from 'graphql';
import gql from 'graphql-tag';

const __dirname = path.resolve();
/**
 * @description Read files synchronously from a folder, with natural sorting
 * @param {String} dir Absolute path to directory
 * @returns {Object[]} List of object, each object represent a file
 * structured like so: `{ filepath, name, ext, stat }`
 */
function readFilesSync(dir) {
  const files = [];
  fs.readdirSync(dir).forEach((filename) => {
    const name = path.parse(filename).name;
    const ext = path.parse(filename).ext;
    const filepath = path.resolve(dir, filename);
    const stat = fs.statSync(filepath);
    const isFile = stat.isFile();
    if (isFile &&  ext === '.jpg' ) {
      const base64String = fs.readFileSync(filepath, 'base64');
      files.push({ filepath, name, ext, stat, base64String: `data:image/jpg;base64,${base64String}` });
    }
  });

  files.sort((a, b) => {
    return a.name.localeCompare(b.name, undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  });

  return files;
}

const directory = path.join(__dirname, '../images');
const files = readFilesSync(directory);

fs.writeFileSync(`${__dirname}/base64-images.json`, JSON.stringify(files));


const ADD_SKILL = gql`
mutation uploadFileItem($member: String, $title: String!, $image: String!) {
	uploadFileItem(
		data: { member: $member, entityType: Blog, title: $title, type: PHOTO, base64String: $image }
	) {
		id
		size
		url
		title
		type
	}
}
`

axios.interceptors.request.use(config => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..JWT';
  config.headers["Authorization"] = `Bearer ${token}`;
  return config;
});

for (let photo of files) {
  const { name, base64String } = photo;
  console.log({ name, base64String })
  axios.post('http://localhost:5000/graphql', {
    query: print(ADD_SKILL),
    variables: {
      member: 'cl4yg6cw90456txjxl2j95vlf',
      title: name,
      image: base64String,
    },
  })
  .then(res => console.log(res))
  .catch(err => console.log(err.response.data))

}
