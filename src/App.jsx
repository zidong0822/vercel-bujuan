import React from 'react'
import bindAll from 'lodash.bindall';
import { Button, Steps, Table, Space, message } from 'antd';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { compress } from 'squoosh-compress';
import { imageUpload } from './imageUpload';
import Header from './components/header/header.jsx';
import Vector from './asset/resource/Vector.svg';
import './App.less';
import './fontConfig';
const Step = Steps.Step;

class App extends React.Component {
  constructor(props) {
    super(props);
    bindAll(this, [
      'uploadFile',
      'readFileAsync',
      'compressFile',
      'downloadImage',
      'clearData',
      'downloadAll'
    ])
    this.loading = this.loadingAnimation();
    this.uploadList = [];
    this.downListData = [];
    this.state = {
      uploadTitle: '上传',
      uploadDescription: '请上传图片',
      compressTitle: '压缩',
      compressDescription: '将图片进行压缩',
      finishTitle: '完成',
      finishDescription: '欢迎你使用',
      currentIndex: 0,
      tableData: [],
      isDownloading: false
    }
    this.columns = [
      {
        title: '文件名称',
        key: 'name',
        render: (data) =>{
          const fileName = data.name.substring(data.name.lastIndexOf('.') + 1).toLowerCase();
          if (fileName !== 'png' && fileName !== 'jpg' && fileName !== 'webp' && fileName !== 'jpeg'){
            return <div><div>{data.name}</div><div style={{color:'#C41A1A'}}>不支持的文件格式</div> </div>
          }else{
            return this.formatFileSize(data.inputSize) > 5  ? <div><div>{data.name}</div><div style={{color:'#CD7F32'}}><img className='viptip' alt='' />超大图片压缩体验</div> </div> : data.name
          }
        },
      },
      {
        title: '压缩前',
        key: 'inputSize',
        render: (data) => (
          this.formatOutFileSize(data.inputSize)
        ),
      },
      {
        title: '压缩后',
        key: 'outputSize',
        render: (data) =>(
          data.outputSize === 0 ? '-' : this.formatOutFileSize(data.outputSize)
        ),
      },
      {
        title: '缩小百分比',
        key: 'percentage',
        render: (data) =>(
          data.outputSize === 0 ? '-' : data.percentage
        ),
      },
      {
        title: '操作',
        key: 'action',
        render: (data) => (
          <Space size="middle">
             { 
              // eslint-disable-next-line no-undef 
              data.outputSize === 0 ? <Button type="link" className='delete-button'></Button> : <a href={`https://scratchcoding.xyz/${data.name}?attname=${data.name}`} className='download-button'  onClick={()=>_czc.push(['_trackEvent','下载','点击','下载单张图片','5','download'])}>下载</a> 
             }
          </Space>
        ),
      },
    ];
  }

  clearData() {
    this.uploadList = [];
    this.downListData = [];
    this.loading.parentNode && this.loading.parentNode.removeChild(this.loading);
    this.setState({
      uploadTitle: '上传',
      uploadDescription: '请上传图片',
      compressTitle: '压缩',
      compressDescription: '将图片进行压缩',
      finishTitle: '完成',
      finishDescription: '欢迎你使用',
      currentIndex: 0,
      tableData: [],
      isDownloading: false
    })
  }
  
  async downloadAll(e) {
    // eslint-disable-next-line no-undef
    _czc.push(['_trackEvent','下载','点击','下载所有图片','5','download'])
    if(this.state.tableData.length === 0){
      return;
    }
    if(this.state.tableData.length === 1){
      this.downloadImage(this.state.tableData[0])
      return;
    }
    if(this.state.isDownloading)return;
    this.setState({isDownloading: true})
    const compressDiv = document.getElementsByClassName('download-all-button')[0];
    compressDiv.innerHTML = '';
    compressDiv.style.backgroundColor = 'rgba(19, 90, 245, 0.7)';
    compressDiv.appendChild(this.loading);
    const zip = new JSZip()
    const cache = {}
    const promises = []
    await this.state.tableData.filter(item => item.url !== '').forEach(item => {
       const promise = fetch(`https://scratchcoding.xyz/${item.name}`)
      .then((res) => res.blob())
      .then(result=>{
        zip.file(item.name, result, { binary: true })
        cache[item.name] = result
      })
      promises.push(promise)
    })
    Promise.all(promises).then(() => {
      zip.generateAsync({
        type: "blob"
      }).then(content => {
        this.setState({isDownloading: false})
        this.loading.parentNode && this.loading.parentNode.removeChild(this.loading);
        compressDiv.innerHTML = '下载';
        compressDiv.style.backgroundColor = 'rgba(19, 90, 245)';
        FileSaver.saveAs(content, "images.zip")
      })
    })
  }

  downloadImage(data) {
      const downloadLink = document.createElement('a');
      document.body.appendChild(downloadLink);
      downloadLink.href = `https://scratchcoding.xyz/${data.name}?attname=${data.name}`;
      downloadLink.download = data.name;
      downloadLink.click();
      document.body.removeChild(downloadLink);
  }

  uploadFile(e) {
    this.setState({ uploadTitle: '上传中' });
    this.clearData();
    const files = e.target.files;
    Promise.all(Array.from(files).map((file, index) => this.readFileAsync(file, index, files.length)
      .then((data) => this.uploadList.push({ name: data.name, data: data.data, size: data.size }))))
      .then(() => {
        this.setState({ uploadDescription: '上传完成', currentIndex: 1 });
        this.compressFile();
      })
  }

  formatFileSize(bytes) {
    if(bytes === 0) return 0;
    return parseFloat((bytes / (1000 * 1000)).toFixed(1));
  }

  formatOutFileSize(bytes,decimalPoint) {
    if(bytes === 0) return '0 Bytes';
    var k = 1000,
        dm = decimalPoint || 2,
        sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
        i = Math.floor(Math.log(bytes)/Math.log(k));
    return parseFloat((bytes/Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
 }

  readFileAsync(file, index, count) {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = evt => resolve({ name: file.name, data: evt.target.result, size: evt.target.result.byteLength})
      reader.readAsArrayBuffer(file)
      reader.onprogress = (evt) => {
        this.setState({ uploadDescription: `第${index + 1}/${count}张 ${Math.floor(evt.loaded / file.size * 100)}%` });
      }
    })
  }

  loadingAnimation(){
    const loader = document.createElement('div');
    loader.className = 'loader';
    for(let i = 0; i < 5; i++){
      const dot = document.createElement('div');
      dot.className = 'dot';
      loader.appendChild(dot);
    }
    return loader;
  }

  async compressFile() {
    this.setState({ compressTitle: '压缩中' });
    const compressDiv = document.getElementsByClassName('ant-steps-item-description')[1];
    compressDiv.innerHTML = '';
    compressDiv.appendChild(this.loading);
    for (let index in this.uploadList) {
      const data = this.uploadList[index];
      const fileType = data.name.substring(data.name.lastIndexOf('.') + 1).toLowerCase();
      if (!['png','jpg','webp','jpeg'].includes(fileType)){
        this.downListData.push({failed:true});
      }else if(this.formatFileSize(data.size) > 0){
        try {
          const blob = new Blob([data.data],{type:'image/jpeg'})
          const image = await compress(blob,{type: "browser-jpeg",options:{quality:0.75}},fileType);
          const data1 = { name: data.name };
          const tokenData = await fetch('/api/uploadtoken', { method: 'POST',headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data1) }).then(res => res.json())
          await imageUpload(image,tokenData.token,data.name);
          this.downListData.push({ input : { size : blob.size },output:{ size : image.size, url: data.name }});  
        }catch(error){
          console.log('error',error);
          this.downListData.push({failed:true});
        }
        
      }else{
        await fetch('/api/compressimage', {  method: 'POST', headers:{ 'FileName': encodeURIComponent(data.name)}, body: data.data }).then(res => res.json()).then(data=>{
          this.downListData.push(data);
        }).catch((error)=>{
          if(error.message === 'Failed to fetch'){
            this.clearData();
            message.error(`压缩失败！请检查网络连接`)
          }
          this.downListData.push({failed:true});
        })
      }
    }
    const tableData = this.uploadList.map((data, index) => {
        const isFailed = this.downListData[index].failed;
        const inputSize = isFailed ? this.uploadList[index].size : this.downListData[index].input.size;
        const outputSize = isFailed ? 0 : this.downListData[index].output.size;
        const url = isFailed ? '': this.downListData[index].output.url;
        return { key: `${index}`, name: data.name, inputSize: inputSize, outputSize: outputSize, percentage: `${Math.floor((inputSize - outputSize) / inputSize * 100)}%`, action: '', url: url }
    })
    this.loading.parentNode && this.loading.parentNode.removeChild(this.loading);
    this.setState({ compressTitle: '压缩', compressDescription: '压缩完成', currentIndex: 2, finishTitle: '完成', finishDescription: '感谢你使用', tableData: tableData });
  }

  render() {
    const paginationProps = { pageSize:this.state.tableData.length };
    return (
      <div className='container'>
        <Header></Header>
        <div className='choose-file'>
          <a href="https://www.bujuan.me" className="input-file">
            <input type="file" name="file" multiple="multiple" className='input-choose-file' onChange={this.uploadFile} onClick={(event) => { event.target.value = null }} />
          </a>
          <img className='choose-image' src={Vector} alt=''></img>
          <div className='choose-title'>将你的WebP、PNG或JPEG文件放在此处！</div>
          <div className='choose-tip'>
            <div>最多20张图片，每张最大5MB</div>
            <div style={{color:'#CD7F32'}}>（5M以上免费体验）</div>
          </div>
        </div>
        <div className='steps-container'>
          <Steps current={this.state.currentIndex}  direction="horizontal" responsive={false} className='steps'>
            <Step title={this.state.uploadTitle} description={this.state.uploadDescription} />
            <Step title={this.state.compressTitle} description={this.state.compressDescription} className='step-compress'/>
            <Step title={this.state.finishTitle} description={this.state.finishDescription} />
          </Steps>
        </div>
        {
          this.state.tableData.length === 0 ? '' :
            <div className='download-container'>
              <div className='download-all'>
                <Button type="primary" shape="round" className='download-all-button' onClick={this.downloadAll}>下载</Button>
                <Button type="link" className='clear-button' onClick={this.clearData}>清空</Button>
              </div>
              <div className='download-single'>
                <Table columns={this.columns} dataSource={this.state.tableData} pagination={paginationProps} />
              </div>
            </div>
        }
      </div>
    );
  }
}

export default App
