import React, { Component } from "react";
import Staking from "./Staking";
import Pump from "./Pump";
import Mine from "./Mine";
import NinjaToken from "./contracts/NinjaToken.json";
import CatnipToken from "./contracts/CatnipToken.json";
import getWeb3 from "./getWeb3";
import {setWeb3} from "./shared";

import "./App.css";

import ninjaGif from './assets/ninja-small.gif';
import ninjaLogo from './assets/ninja-logo.png';

import Web3 from "web3";

//import WalletConnect from "@walletconnect/client";
//import QRCodeModal from "@walletconnect/qrcode-modal";
import WalletConnectProvider from "@walletconnect/web3-provider";

// // Create a connector
// const connector = new WalletConnect({
//   bridge: "https://bridge.walletconnect.org", // Required
//   qrcodeModal: QRCodeModal,
// });


// // Check if connection is already established
// if (!connector.connected) {
//   // create new session
//   connector.createSession();
// }

// // Subscribe to connection events
// connector.on("connect", (error, payload) => {
//   if (error) {
//     throw error;
//   }

//   // Get provided accounts and chainId
//   const { accounts, chainId } = payload.params[0];
// });

// connector.on("session_update", (error, payload) => {
//   if (error) {
//     throw error;
//   }

//   // Get updated accounts and chainId
//   const { accounts, chainId } = payload.params[0];
// });

// connector.on("disconnect", (error, payload) => {
//   if (error) {
//     throw error;
//   }

//   // Delete connector
// });

class App extends Component {
  state = {
    isViewingStaking : false,
    isViewingPump: false,
    ninjaBalance: 0,
    totalNinjaSupply: 0,
    totalNinjaStaked: 0,
    totalCatnipSupply: 0,
    isViewingGifts: false,
    isViewingMine: false
   };

   mediaQuery = {
    desktop: 1200,
    tablet: 768,
    phone: 576,
  };

  toFixed(num, fixed) {
    var re = new RegExp('^-?\\d+(?:.\\d{0,' + (fixed || -1) + '})?');
    return num.toString().match(re)[0];
  }

  getRoundedNinjaBalance() {
    return this.toFixed(this.state.ninjaBalance, 6);
  }

  getRoundedTotalNinjaStaked() {
    let _ninjaStaked = this.state.totalNinjaStaked;
    if (!isNaN(_ninjaStaked)) {
      return parseFloat(_ninjaStaked).toFixed(2);
    }
    
    return _ninjaStaked;
  }

   getNinjaBalance = async () => {
     let _ninjaBalance = await this.ninjaInstance.methods.balanceOf(this.accounts[0]).call();
     this.setState({
       ninjaBalance: this.web3.utils.fromWei(_ninjaBalance)
     })
   }

   getNinjaSupply = async () => {
    let _ninjaSupply = await this.ninjaInstance.methods.totalSupply().call();
    this.setState({
      totalNinjaSupply: this.web3.utils.fromWei(_ninjaSupply)
    })
  }

  totalNinjaStaked = async () => {
   let _totalNinjaStaked = await this.catnipInstance.methods.totalStakedSupply().call();

   this.setState({
     totalNinjaStaked: this.web3.utils.fromWei(_totalNinjaStaked)
   })
 }

 getCatnipSupply = async () => {
  let _catnipSupply = await this.catnipInstance.methods.totalSupply().call();

  this.setState({
    totalCatnipSupply: this.web3.utils.fromWei(_catnipSupply)
  })
}

   setNinjaAddress = async () => {
     await this.catnipInstance.methods.setNinjaAddress(this.ninjaInstance._address).send({
      from: this.accounts[0],
      gas: 1000000
     });
   }

   toggleStakingView = () => {
    this.setState({
      isViewingStaking: !this.state.isViewingStaking
    });
  };


  togglePumpView = () => {
    this.setState({
      isViewingPump: !this.state.isViewingPump
    })
  }

  toggleMineView = () => {
    this.setState({
      isViewingMine: !this.state.isViewingMine
    })
  }

  _getWeb3 = () => {
    return this.web3;
  }


  componentDidMount = async () => {
    document.title = "Ninja.finance";

    try {
      // // Get network provider and web3 instance.
      if (!window.ethereum) {
          //  Create WalletConnect Provider
        const provider = new WalletConnectProvider({
          infuraId: "83301e4b4e234662b7769295c0f4a2e1" // Required
        });

        //  Enable session (triggers QR Code modal)
        await provider.enable();

        //  Create Web3
        this.web3 = new Web3(provider);
      } else {
        this.web3 = await getWeb3();
      }

      
      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();
      
      // Get the contract instance.
      this.networkId = await this.web3.eth.net.getId();
     
      this.ninjaInstance = new this.web3.eth.Contract(
        NinjaToken.abi,
        process.env.REACT_APP_NINJA_TOKEN_CONTRACT_ADDRESS
      );
     
      this.catnipInstance = new this.web3.eth.Contract(
        CatnipToken.abi,
        process.env.REACT_APP_CATNIP_TOKEN_CONTRACT_ADDRESS
      );

      setWeb3(this.web3);

      this.getNinjaSupply();
      this.getCatnipSupply();
      this.totalNinjaStaked();
    
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({loaded: true}, this.getNinjaBalance);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };


  render() {
    // if (!this.state.loaded) {
    //   return <div>Loading Web3, accounts, and contract...</div>;
    // }
    return (
      <div className="App">
        <div className="Logo">NINJA.FINANCE</div>
        <div className="top-box-container">
          <div className="top-box balance-box">
            <img className="balance-logo-image" alt="balance logo" src={ninjaLogo}/>
            <div className="top-box-desc">Your NINJA Balance</div>
            <div className="top-box-val ninja-balance">{this.getRoundedNinjaBalance()}</div>
          </div>
          <div className="top-box stats-box">
            <div className="stats-op">
              <div className="top-box-desc">Total Ninja Supply</div>
              <div className="top-box-val">{this.state.totalNinjaSupply}</div>
            </div>
            <div className="stats-op">
              <div className="top-box-desc">Total Ninja Staked</div>
              <div className="top-box-val">{this.getRoundedTotalNinjaStaked()}</div>
            </div>
            <div className="stats-op">
              <div className="top-box-desc">Total Catnip Supply</div>
              <div className="top-box-val">{this.state.totalCatnipSupply}</div>
            </div>
          </div>
        </div>
        <div styles={{backgroundImage: `url(${ninjaGif})`}} className="Ninja-cat"></div>
        <div className="Options-box">
          <div className="Option stake" onClick={this.toggleStakingView}>
            <h3>STAKE</h3>
          </div>
          <div className="Option mine" onClick={this.toggleMineView}>
          <h3>MINE</h3>
          </div>
          <div className="Option pumped" onClick={this.togglePumpView}>
          <h3>PUMP</h3>
          </div>
        </div>


        {this.state.isViewingStaking ? <Staking toggle={this.toggleStakingView} /> : null}
        {this.state.isViewingPump ? <Pump toggle={this.togglePumpView} /> : null}
        {this.state.isViewingMine ? <Mine toggle={this.toggleMineView} /> : null}

        <div className="address ny"><div className="addr-name">NINJA address:</div> <div className="addr-pink">0xc9ce70a381910d0a90b30d408cc9c7705ee882de</div></div>
        <div className="address ct"><div className="addr-name">CATNIP address:</div> <div className="addr-pink">0xd2b93f66fd68c5572bfb8ebf45e2bd7968b38113</div> </div>
        <div className="address dny"><div className="addr-name">darkNinja address:</div> <div className="addr-pink">0x23b7f3A35bda036e3B59A945E441E041E6B11101</div> </div>
        <div className="links-box">
          <a href="https://etherscan.io/token/0xc9ce70a381910d0a90b30d408cc9c7705ee882de">NINJA Token Etherscan</a> . <a href="https://uniswap.info/pair/0x544cd63c9a3363dab66733bf8073cb981db58cba">NINJA-ETH Uniswap</a>
        </div>
        <div className="social-box">
            <a target="_blank" rel="noopener noreferrer" href={"https://github.com/geass-zero/ninja.finance"}>
              <div className="social-icon git"></div>
            </a>
            <a target="_blank" rel="noopener noreferrer" href={"https://www.twitter.com/ninjafinance"}>
              <div className="social-icon twit"></div>
            </a> 
            <a target="_blank" rel="noopener noreferrer" href={"https://t.me/ninjafinance"}>
              <div className="social-icon tele"></div>
            </a>

        </div>
        {/* <div className="gift-icon"></div>
        <div className="gift-box">
          <textarea></textarea>
        </div> */}
      </div>
    );
  }
}

export default App;
