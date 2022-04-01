class SingleLoading {
    constructor(){
        this.textArray = ['下载中.','下载中..','下载中...'];
        this.index = 0;
        this.singleDownloading = null;
        this.singleDownloadingText = null;
    }

    updateLoading({ onUpdateLoading = (() => {}) }) {
        this._onUpdateLoading = onUpdateLoading;
    }

    onUpdateLoading(text) {
        this._onUpdateLoading(text);
    }

    startSingleDownload(onUpdateLoading){
        var textArray = ['下载中.','下载中..','下载中...']
        var index = 0;
        this.singleDownloading = setInterval(() => {
            this.singleDownloadingText = textArray[index];
            onUpdateLoading(this.singleDownloadingText);
            index = index === 2 ? 0 : index += 1;
        }, 1000);
    }

    clearSingleDownload(){
        clearInterval(this.singleDownloading);
        this.index = 0;
        this.singleDownloading = null;
        this.singleDownloadingText = null;
    }
    
}

export default SingleLoading;