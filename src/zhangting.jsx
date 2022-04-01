import React from 'react'
import bindAll from 'lodash.bindall';
import { Table, DatePicker,message, Input, Button, Space } from 'antd';
import moment from 'moment';
import Highlighter from 'react-highlight-words';
import { SearchOutlined } from '@ant-design/icons';
const { Search } = Input;
const dateFormat = 'YYYY/MM/DD';
class ZhangTing extends React.Component {
    constructor(props){
        super(props);
        bindAll(this, [
          'clearData'
        ])
        this.state = {
            tableData:[],
            searchText: '',
            searchedColumn: ''
        }
        this.columns = [
            {
                title: '#',
                key: 'key',
                render: (data) => (data.date ? <div>{data.date}</div> :<div>{data.index}</div>)
            },
            {
                title: '代码',
                key: 'number',
                render: (data) => (<div style={{color:'red'}}>{data.number}</div>)
            },
            {
                title: '名称',
                key: 'name',
                render: (data) => (data.name)
            },
            {
                title: '短线主题',
                dataIndex:'zhuti',
                key: 'zhuti',
                render: (data) => (data.zhuti),
                ...this.getColumnSearchProps('zhuti'),
            },
            {
                title: '现价',
                key: 'xianjia',
                render: (data) => (data.xianjia),
                sorter: (a, b) => a.xianjia - b.xianjia,
            },
            {
                title: '封单',
                key: 'fengdan',
                render: (data) => (this.convert(parseInt(data.fengdan))),
                sorter: (a, b) => a.fengdan - b.fengdan,
            },
            {
                title: '流通',
                key: 'liutong',
                render: (data) => (`${data.liutong}亿`),
                sorter: (a, b) => a.liutong - b.liutong,
            },
            {
                title: '封流比',
                key: 'liutongbi',
                render: (data) => (
                    `${(data.fengdan/(data.liutong*100000000))*100}%`
                ),
                sorter: (a, b) => a.fengdan/(a.liutong*100000000) - (b.fengdan/(b.liutong*100000000)),
            },
          ];
    }

    getColumnSearchProps = dataIndex => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
          <div style={{ padding: 8 }}>
            <Input
              ref={node => {
                this.searchInput = node;
              }}
              placeholder={`搜索主题`}
              value={selectedKeys[0]}
              onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
              onPressEnter={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
              style={{ marginBottom: 8, display: 'block' }}
            />
            <Space>
              <Button
                type="primary"
                onClick={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
                icon={<SearchOutlined />}
                size="small"
                style={{ width: 90 }}
              >
                搜索
              </Button>
              <Button onClick={() => this.handleReset(clearFilters)} size="small" style={{ width: 90 }}>
                重置
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => {
                  confirm({ closeDropdown: false });
                  this.setState({
                    searchText: selectedKeys[0],
                    searchedColumn: dataIndex,
                  });
                }}
              >
                过滤
              </Button>
            </Space>
          </div>
        ),
        filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
        onFilter: (value, record) =>
          record[dataIndex]
            ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
            : '',
        onFilterDropdownVisibleChange: visible => {
          if (visible) {
            setTimeout(() => this.searchInput.select(), 100);
          }
        },
        render: text =>
          this.state.searchedColumn === dataIndex ? (
            <Highlighter
              highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
              searchWords={[this.state.searchText]}
              autoEscape
              textToHighlight={text ? text.toString() : ''}
            />
          ) : (
            text
          ),
      });
    
      handleSearch = (selectedKeys, confirm, dataIndex) => {
        confirm();
        this.setState({
          searchText: selectedKeys[0],
          searchedColumn: dataIndex,
        });
      };
    
      handleReset = clearFilters => {
        clearFilters();
        this.setState({ searchText: '' });
      };

    convert(n){
        return n.toFixed(0).replace(/(\d{1,4})((\d{4})*)$/, (a, b, c) => {
            const t = ["", "万", "亿", "万亿"][c.length / 4]
            return t ? `${b}.${c.slice(0,2)}${t}` : b
        })
    }

    componentDidMount(){
        const dateString = moment(new Date(), dateFormat,'en', true).toISOString().slice(0,10);
        this.loadData(dateString)
       
    }

    clearData(){
      this.setState({tableData:[]})
    }

    loadData(date){
        this.clearData();
        message.loading({ content: '加载数据中...' });
        fetch(`/api/zhangting/?date=${date}`).then(res=>res.json()).then(result=>{
            const data = result.data
            .sort(function(a,b){return  b.fengdan/(b.liutong*100000000) - a.fengdan/(a.liutong*100000000) })
            .map((rowData,index)=>{
                rowData.index = index + 1;
                return rowData;
            });
            this.setState({tableData:data});
            message.success({ content: '加载完成' });
        })
    }

    onChange(date, dateString) {
        this.loadData(dateString.replaceAll('/','-'))
    }

    onSearch(number){
      this.clearData();
        message.loading({ content: '加载数据中...' });
        fetch(`/api/dealdata/?number=${number}`).then(res=>res.json()).then(result=>{
            const data = result.data
            .sort(function(a,b){return new Date(a.date) - new Date(b.date)})
            .map((rowData,index)=>{
                rowData.index = index + 1;
                return rowData;
            });
            this.setState({tableData:data});
            message.success({ content: '加载完成' });
        })
    }
      
    render() {
        const paginationProps = { pageSize:this.state.tableData.length };
        return(<div>
            <DatePicker onChange={this.onChange.bind(this)} defaultValue={moment(new Date(), dateFormat)} format={dateFormat}/>
            <Search placeholder="股票代码" onSearch={this.onSearch.bind(this)} style={{ width: 200 }} />
            <Table columns={this.columns} dataSource={this.state.tableData} pagination={paginationProps} showSorterTooltip={{ title: '排序' }} bordered/>
            </div>)
    }
}
export default ZhangTing;