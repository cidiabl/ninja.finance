import React, { Component } from "react";
import DarkNinja from "./contracts/DarkNinja.json";
import catnipUni from "./contracts/DarkNinjaUni.json";
import {getWeb3Var} from "./shared";

import ethLogo from './assets/eth.png';
import catnipLogo from './assets/catnip.png';
import dNinjaLogo from './assets/dNinja.png';

export default class Pump extends Component {
state = {
    loaded: false,
    stakeAmount: 0,
    stakedAmount: 0,
    catnipUniAmount: 0,
    miningStarted: true,
    isApproved: false,
    isApproving: false,
    isStaking: false,
    isWithdrawing: false,
    darkNinjaRewards: 0,
    totalDNinjaSupply: 0,
    totalDNinjaUniSupply: 0,
    allowance: 0,
    isClaiming: false
    };

  handleClick = () => {
    this.props.toggle();
  };

  setInputField() {
    if (this.state.stakeAmount > 0) {
      return this.state.stakeAmount;
    } else {
      return null
    }
  }

  updateStakingInput(e) {
    this.setState({stakeAmount: e.target.value})
    if (this.state.stakeAmount > this.state.allowance) {
        this.setState({isApproved: false})
    }
 }

  getCatnipUniAmount = async () => {
    let _catnipUniAmount = await this.catnipUniInstance.methods.balanceOf(this.accounts[0]).call();
    this.setState({
      catnipUniAmount: this.web3.utils.fromWei(_catnipUniAmount)
    })
  }

  getCatnipUniAllowance = async () => {
    let _catnipUniAllowance = await this.catnipUniInstance.methods.allowance(this.accounts[0], this.darkNinjaInstance._address).call();
    if (_catnipUniAllowance > 0) {
        this.setState({isApproved: true, allowance: this.web3.utils.fromWei(_catnipUniAllowance.toString())});
        
    }
    console.log(this.state.allowance);
  }

  getDNinjaSupply = async () => {
    let _dNinjaSupply = await this.darkNinjaInstance.methods.totalSupply().call();
    this.setState({
      totalDNinjaSupply: this.web3.utils.fromWei(_dNinjaSupply)
    })
  }

  approveCatnipUni = async () => {
    if (this.state.isApproving) {
        return;
    }  
    this.setState({isApproving: true});
    
    try {
        let approveStaking = await this.catnipUniInstance.methods.approve(this.darkNinjaInstance._address, this.web3.utils.toWei(this.state.totalDNinjaUniSupply.toString())).send({
            from: this.accounts[0]
        });
        
        if (approveStaking["status"]) {
            this.setState({isApproving: false, isApproved: true});
        } 
    } catch {
        this.setState({isApproving: false, isApproved: false});
    }
  }

  getCatnipUniStakeAmount = async () => {
    let stakeA = await this.darkNinjaInstance.methods.getNipUniStakeAmount(this.accounts[0]).call();
    console.log(stakeA);
    this.setState({stakedAmount: this.web3.utils.fromWei(stakeA)});
  }

  getRewardsAmount = async () => {
    let rewards = await this.darkNinjaInstance.methods.myRewardsBalance(this.accounts[0]).call();

    this.setState({darkNinjaRewards: this.web3.utils.fromWei(rewards)});
  }

  getReward = async () => {
    this.setState({isClaiming: true});
    
    let myRewards = await this.darkNinjaInstance.methods.getReward().send({
        from: this.accounts[0]
    });
    
    if (myRewards["status"]) {
        this.setState({isClaiming: false, darkNinjaRewards: 0});   
    }
  }

  stakeCatnipUni = async () => {
    if (this.state.isStaking || this.state.stakeAmount === 0) {
        return;
    }                        
    this.setState({isStaking: true});
    console.log(this.web3.utils.toWei(this.state.stakeAmount.toString()));
    try {
        let stakeRes = await this.darkNinjaInstance.methods.stakeCatnipUni(this.web3.utils.toWei(this.state.stakeAmount.toString())).send({
            from: this.accounts[0]
        });
        if (stakeRes["status"]) {
            this.setState({isStaking: false, stakeAmount: 0});
            this.getCatnipStakeAmount();
        }
    } catch (error) {
        this.setState({isStaking: false});
        console.log(error);
    }
  }

  withdrawNipUni = async () => {
    if (this.state.isWithdrawing || this.state.stakeAmount === 0) {
      return;
    }                        
    this.setState({isWithdrawing: true});
    
    try {
      let stakeRes = await this.darkNinjaInstance.methods.withdrawCatnipUni(this.web3.utils.toWei(this.state.stakeAmount.toString())).send({
        from: this.accounts[0]
      });
        if (stakeRes["status"]) {
            this.setState({isWithdrawing: false, stakeAmount: 0});
            this.getCatnipStakeAmount();
        }
    } catch (error) {
        this.setState({isStaking: false});
        console.log(error);
    }
  }



  componentDidMount = async () => {

    try {
      this.web3 = getWeb3Var();
        
      // Get network provider and web3 instance.
     
      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();
    
      // Get the contract instance.
      this.networkId = await this.web3.eth.net.getId();

      console.log(this.web3.eth)

      this.catnipUniInstance = new this.web3.eth.Contract(
        catnipUni,
        "0xdB8C25B309Df6bd93d361ad19ef1C5cE5A667d6A"
      );

      console.log(this.catnipUniInstance);

      // this.darkNinjaLP = new this.web3.eth.Contract(

      // )


      this.darkNinjaInstance = new this.web3.eth.Contract(
        DarkNinja.abi,
        "0x23b7f3a35bda036e3b59a945e441e041e6b11101",
      );

      this.getCatnipUniStakeAmount();
      this.getDNinjaSupply();
      this.getCatnipUniAllowance();
      this.getCatnipUniAmount();
      this.getRewardsAmount();

    //   this.getMyStakeAmount();
    //   this.getCatnipRewards();

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({loaded: true});
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  render() {
    return (
      <div className="modal">
        <div className="modal_content">
          <span className="close" onClick={this.handleClick}>
            &times;
          </span>
          <h1>MINE darkNINJA</h1>
            <h3>Create the bridge to the Polkadot network!</h3>

            <div>
                <p>darkNINJA is an extension to the NINJA ecosystem that will allow NINJA voters to acquire non ERC20 assets.</p>
            </div>
            
            <div>
                <p>20% of all minted darkNINJA will go to a funding contract.</p>
            </div>
          
            {/* <div>
                <p>darkNINJA is a rarity. The only way to mint more darkNINJA is to provide liquidity for Catnip. </p>
            </div> */}

            <div>
              <p>Join the NIP/ETH pool on&nbsp;
                 <a target="_blank" rel="noopener noreferrer" href="https://app.uniswap.org/#/add/ETH/0xd2b93f66fd68c5572bfb8ebf45e2bd7968b38113">Uniswap</a>
                , then stake your pool tokens here.</p>
            </div>
            
            <div className="amount-staked-box">
              <div className="inline-block amount-staked-image">
                <img className="balance-logo-image" src={catnipLogo}/>
                /
                <img className="balance-logo-image" src={ethLogo}/>
              </div>
              <div className="inline-block">
                <div className="top-box-desc">Amount in Wallet</div>
                <div className="top-box-val ninja-balance">{this.state.catnipUniAmount}</div>
              </div>
              <div className="inline-block">
                <div className="top-box-desc">Amount staked</div>
                <div className="top-box-val ninja-balance">{this.state.stakedAmount}</div>
              </div>
            </div>

            <div className="amount-staked-box">
              <div className="inline-block amount-staked-image">
                <img className="reward-logo-image" src={dNinjaLogo}/>
              </div>
              <div className="inline-block">
                <div className="top-box-desc">darkNinja Rewards</div>
                <div className="top-box-val ninja-balance">{this.state.darkNinjaRewards}</div>
              </div>
            </div>
            <div>
                <input 
                className="input-amount" 
                placeholder="Amount..."
                value={this.setInputField()} 
                onChange={this.updateStakingInput.bind(this)}
                type="number"
                autoFocus={true}>
                </input>
            </div>
            <div className="stake-warning">Make sure to always claim mining rewards before staking more!</div>
            {!this.state.miningStarted ? <div className="button stake-button">
                {!this.state.isStaking ? <div>MINING HAS NOT STARTED</div> : null}
            </div> : null}
            {!this.state.isApproved && this.state.miningStarted ? <div className="button stake-button" onClick={this.approveCatnipUni}>
                {!this.state.isApproving ? <div>APPROVE</div> : null}
                {this.state.isApproving ? <div>APPROVING...</div> : null}
            </div> : null}
            {this.state.miningStarted  ? <div className="button stake-button inliner" onClick={this.getReward}>
                {!this.state.isClaiming ? <div>CLAIM REWARDS</div> : null}
                {this.state.isClaiming ? <div>CLAIMING...</div> : null}
            </div> : null}
            {this.state.isApproved && this.state.miningStarted ? <div className={`button stake-button inliner ${this.state.stakeAmount > 0 && this.state.stakeAmount < this.state.ninjaBalance ? "" : "disabled"}`} onClick={this.stakeCatnipUni}>
                {!this.state.isStaking ? <div>STEP 2: STAKE</div> : null}
                {this.state.isStaking ? <div>STAKING...</div> : null}
            </div> : null}
            {this.state.miningStarted ? <div className={`button withdraw-button ${this.state.stakeAmount > 0 && this.state.stakeAmount <= this.state.darkNinjaRewards ? "" : "disabled"}`} onClick={this.withdrawNipUni}>
                {!this.state.isWithdrawing ? <div>WITHDRAW</div> : null}
                {this.state.isWithdrawing ? <div>WITHDRAWING...</div> : null}
            </div> : null}

            <div>
                <h3>Boost your darkNinja mining.</h3>
            </div>
            <div>
                <input 
                className="input-amount" 
                placeholder="Amount..."
                value={this.setInputField()} 
                onChange={this.updateStakingInput.bind(this)}
                type="number"
                autoFocus={true}>
                </input>
            </div>
            <div className="stake-warning">Make sure to always claim mining rewards before staking more!</div>
            {!this.state.miningStarted ? <div className="button stake-button">
                {!this.state.isStaking ? <div>MINING HAS NOT STARTED</div> : null}
            </div> : null}
            {!this.state.isApproved && this.state.miningStarted ? <div className="button stake-button" onClick={this.approveCatnipUni}>
                {!this.state.isApproving ? <div>APPROVE</div> : null}
                {this.state.isApproving ? <div>APPROVING...</div> : null}
            </div> : null}
            {this.state.isApproved && this.state.miningStarted ? <div className={`button stake-button inliner ${this.state.stakeAmount > 0 && this.state.stakeAmount < this.state.ninjaBalance ? "" : "disabled"}`} onClick={this.stakeCatnipUni}>
                {!this.state.isStaking ? <div>STEP 2: STAKE</div> : null}
                {this.state.isStaking ? <div>STAKING...</div> : null}
            </div> : null}
            {this.state.miningStarted ? <div className={`button withdraw-button ${this.state.stakeAmount > 0 && this.state.stakeAmount <= this.state.darkNinjaRewards ? "" : "disabled"}`} onClick={this.withdrawNipUni}>
                {!this.state.isWithdrawing ? <div>WITHDRAW</div> : null}
                {this.state.isWithdrawing ? <div>WITHDRAWING...</div> : null}
            </div> : null}
        </div>
      </div>
    );
  }
}
