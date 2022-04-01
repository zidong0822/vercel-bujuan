import * as qiniu from 'qiniu-js'
export  function  imageUpload (file, token, name){
    const config = {
        useCdnDomain: true,
        region: qiniu.region.na0
    };
    const putExtra = {
        fname: '',
        mimeType: file.type,
        forceDirect: true
    };
    const observable = qiniu.upload(file, name, token, putExtra, config)
    return new Promise(async (resolve, reject) => {
        observable.subscribe({
            next: (result) => {
            },
            error: (error) => {
                reject(error);
            },
            complete: (res) => {
                resolve(res.key);
            },
        });
    })
}