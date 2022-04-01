import React from 'react'
import './header.less';

class Header extends React.Component {

  render() {
    return (
      <div className='header'>
        <div className='header-left'>
          <div className='logo'></div>
        </div>
        <div className='header-right'>
          {/* <Button type="primary" shape="round" className='free-trial'>免费使用</Button>
          <Button type="link" className='login'>登录</Button> */}
        </div>
      </div>
    );
  }
}

export default Header