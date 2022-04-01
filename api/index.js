const app = require('express')()
const bodyParser = require('body-parser')
const tinify = require('tinify')
const qiniu  = require('qiniu')
const {ImagePool} = require('@squoosh/lib');
const {cpus}  = require('os');
const clientPromise = require('./mongodb-client');
const https = require('https');
const { JSDOM } = require("jsdom");
app.use(bodyParser.json({limit: '50mb'}));
app.set('port', (process.env.PORT || 8081));
tinify.key = '9tvr9NXvHZzBPJ3RqLJy2wyh07zGkfMH';
const qiniuKey = {
	accessKey:'BtTJ0jvCxxzpD6H9a0eb0qXvzSQZb3S5CmaeXxEP',
	secretKey:'JgjS6Hzg--VD2HLSI8sUjqsXeWqDe_fBGuL7y15t'
}

app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", " Origin, X-Requested-With, Content-Type, Accept,FileName");
  next();
});

app.get('/api/test', (req, res) => {
	res.json({'data':'hello world'})
})

app.get('/api/zhangting',async (req, res) => {
	var params  = req.query;
	https.get(`https://www.xilimao.com/zhangting/${params.date}.html`, (response) => {
	let rawData = '';
  	response.on('data', (chunk) => { rawData += chunk; });
  	response.on('end', async () => {
    	const dom = new JSDOM(rawData);
			const cyArray = dom.window.document.getElementsByClassName('cy');
			const result = [];
			for (let i in cyArray) {
				if(parseInt(i).toString() !== 'NaN'){
					const string = cyArray[i].childNodes[7].getAttribute('title')
					const start = string.indexOf('>');
					const end = string.indexOf(':')
					const name = string.substring(start+1,end);
					const data = {key:i,number:name.split('_')[0],name:name.split('_')[1],zhuti:cyArray[i].childNodes[7].innerHTML,'xianjia':cyArray[i].childNodes[11].innerHTML,'fengdan':cyArray[i].childNodes[15].childNodes[0].innerHTML,'liutong':cyArray[i].childNodes[29].innerHTML}
					result.push(data);
				}
			}
			res.json({'data':result})
  	});
	}, (error)=>{
		console.log(error)
	});
})

app.get('/api/updatedata',async (req, res) => {
	var params  = req.query;
	https.get(`https://www.xilimao.com/zhangting/${params.date}.html`, (response) => {
	let rawData = '';
  	response.on('data', (chunk) => { rawData += chunk; });
  	response.on('end', async () => {
    	const dom = new JSDOM(rawData);
			const cyArray = dom.window.document.getElementsByClassName('cy');
			const result = [];
			for (let i in cyArray) {
				if(parseInt(i).toString() !== 'NaN'){
					const string = cyArray[i].childNodes[7].getAttribute('title')
					const start = string.indexOf('>');
					const end = string.indexOf(':')
					const name = string.substring(start+1,end);
					const data = {key:i,number:name.split('_')[0],name:name.split('_')[1],zhuti:cyArray[i].childNodes[7].innerHTML,'xianjia':cyArray[i].childNodes[11].innerHTML,'fengdan':cyArray[i].childNodes[15].childNodes[0].innerHTML,'liutong':cyArray[i].childNodes[29].innerHTML}
					await insertOne(data, params.date)
					result.push(data);
				}
			}
			res.json({'message':'success'})
  	});
	}, (error)=>{
		console.log(error)
	});
})

app.post('/api/compressimage', async (req, res) => {
	try {
		const sourceData = await postImageData(req);
		const data = await freeCompressImage(sourceData);
		res.json({ input : { size : sourceData.length },output:{ size : data.output.size, url: data.output.url }})
	}catch(err){
		res.status(413).send(err.message);
	}
})

app.post('/api/compresslargeimage', async (req, res) => {
	try {
		const fileName = decodeURIComponent(req.headers['filename']);
		const sourceData = await postImageData(req);
		const compressData = await compressLargeImage(fileName,sourceData);
		const data = await putImageData(compressData,fileName);
		res.json({ input : { size : sourceData.length },output:{ size : compressData.length, url: data.key }})
	}catch(err){
		res.status(413).send(err.message);
	}
})


app.get('/api/totalcount',	async (req,res) => {
	const client = await clientPromise;
	const dbConnect = client.db();
	dbConnect
	.collection('total')
	.find({})
	.toArray(function (err, result) {
		if (err) {
		  res.status(400).send('Error fetching listings!');
		} else {
		  res.json(result);
		}
	  });
})

const insertOne = async (data,date) => {
	data.date = date;
	const client = await clientPromise;
	const dbConnect = client.db();
	await insertData(dbConnect,data);
}

const insertData = async (db,data) =>{
	return new Promise(async (resolve, reject) => {
		db.collection('money').insertOne(data,function (err, result) {
			resolve();
		})
	})
}

app.get('/api/updatetotal', async (req,res)=>{
	const client = await clientPromise;
	const dbConnect = client.db();
	const query= { _id: 1};
	dbConnect
	.collection('total')
	.updateOne(query,{ $inc: { totalCount: 1 } },function (err, result) {
		if (err) {
			res.status(400).send('Error fetching listings!');
		  } else {
			res.json(result);
		  }
	})
})

app.get('/api/dealdata', async (req,res)=>{
	var params  = req.query;
	const client = await clientPromise;
	const dbConnect = client.db();
	dbConnect
	.collection('money')
	.find({'number':params.number})
	.toArray(function (err, result) {
		if (err) {
		  res.status(400).send('Error fetching listings!');
		} else {
		  res.json({data:result});
		}
	  });
})

app.post('/api/uploadtoken', (req, res) => {
	var mac = new qiniu.auth.digest.Mac(qiniuKey.accessKey, qiniuKey.secretKey);
	var options = {	scope: `bujuan123:${req.body.name}`,	expires: 3600000,fsizeLimit: 1024 * 1024 * 100 };
	var putPolicy = new qiniu.rs.PutPolicy(options);
	var uploadToken= putPolicy.uploadToken(mac);
	res.json({'token':uploadToken})
})


// app.post('/api/compressimage', async (req, res) => {
// 	try {
// 		//const fileName = decodeURIComponent(req.headers['filename']);
// 		const sourceData = await postImageData(req);
// 		const data = await freeCompressImage(sourceData);
// 		// const compressData = await compressImage(sourceData);
// 		// const data = await putImageData(compressData,fileName);
// 		res.json({ input : { size : sourceData.length },output:{ size : data.output.size, url: data.output.url }})
// 	}catch(err){
// 		res.status(413).send(err.message);
// 	}
// })

// const compressImage =  async (sourceData) => {
// 	return new Promise(async (resolve, reject) => {
// 		tinify.fromBuffer(sourceData).toBuffer((err, resultData)=> {
// 			if(err){
// 				reject(err)
// 			}else{
// 				resolve(resultData);
// 			}
// 		});
// 	})
// }

const compressLargeImage = async (fileName,sourceData) => {
	return new Promise(async (resolve, reject) => {
		try {
			const imagePool = new ImagePool(cpus().length);
			const fileType = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    		const typeDict = {'png':{oxipng:{}},'jpg':{mozjpeg:{}},'jpeg':{mozjpeg:{}},webp:{webp:{}}}
    		const image = imagePool.ingestImage(sourceData);
    		await image.decoded;
    		await image.encode(typeDict[fileType]);
    		await imagePool.close();
    		const rawEncodedImage = (await Object.values(image.encodedWith)[0]).binary;
			resolve(rawEncodedImage);
		}catch(err){
			reject(err);
		}
	})
}

const  getRandomIP = () => {
	return Array.from(Array(4)).map(() => parseInt(Math.random() * 255)).join('.')
  }

const freeCompressImage = async (sourceData) => {
	const options = {
		method: 'POST',
		hostname: 'tinypng.com',
		path: '/web/shrink',
		headers: {
		  rejectUnauthorized: false,
		  'Postman-Token': Date.now(),
		  'X-Forwarded-For': getRandomIP(),
		  'Cache-Control': 'no-cache',
		  'Content-Type': 'application/x-www-form-urlencoded',
		  'User-Agent':
			'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36'
		}
	};
	return new Promise(async (resolve, reject) => {
		var req = https.request(options, function(res) {
			res.on('data', buf => {
				let obj = JSON.parse(buf.toString());
				resolve(obj)
			});
		});
		req.write(sourceData, 'binary');
		req.on('error', e => {
			reject(e);
		});
		req.end();
	})
	
	
}


const postImageData = async (req) => {
	return new Promise(async (resolve, reject) => {
	  let msg = []
	  req.on('data', (chunk) => {
		if (chunk) {
		  msg.push(chunk)
		}
	  })
	  req.on('end', () => {
		let buf = Buffer.concat(msg)
		resolve(buf);
	  })
	})
}

const putImageData = async (readableStream,fileName) => {
	return new Promise(async (resolve, reject) => {
		var mac = new qiniu.auth.digest.Mac(qiniuKey.accessKey, qiniuKey.secretKey);
		var options = {	scope: `bujuan123:${fileName}`,	expires: 3600000,fsizeLimit: 1024 * 1024 * 100 };
		var putPolicy = new qiniu.rs.PutPolicy(options);
		var uploadToken= putPolicy.uploadToken(mac);
		var config = new qiniu.conf.Config();
		config.zone = qiniu.zone.Zone_na0;
		var formUploader = new qiniu.form_up.FormUploader(config);
		var putExtra = new qiniu.form_up.PutExtra();
		formUploader.put(uploadToken, fileName, readableStream, putExtra, function(respErr,respBody, respInfo) {
			console.log(respErr,respInfo);
			if (respErr) {
	  			reject(respErr)
			}else{
				resolve(respBody);
			}
		})
  });
}

// const processErrorResponse = (res, statusCode, message) => {
// 	console.log(`${statusCode} ${message}`);
// 	res.status(statusCode).send({
// 		error: {
// 			status: statusCode,
// 			message: message
// 		},
// 	});
// }

app.listen(app.get('port'), function() {
	console.log('bujuan api is running on port', app.get('port'));
});

module.exports = app	