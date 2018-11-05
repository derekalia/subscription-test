import React, { Component } from 'react';
import web3 from './web3';
import subscriptionContract from './subscriptionContract.js';
// import styled from 'styled-components';
class App extends Component {
  state = {
    account: null,
    accountTo: null,
    tokenAddress: null,
    toAddress: null,
    gasPrice: null,
    tokenAmount: null,
    periodSeconds: null,
    isReadyError: null,
    exeError: null
  };

  async componentDidMount() {
    if (web3) {
      let accounts = await web3.eth.getAccounts();

      this.setState({
        account: accounts[0],
        toAddress: '0xE28B9FF2b13f8dd3bCb64c4efF04d7361725c855',
        tokenAddress: '0x0000000000000000000000000000000000000000',
        gasPrice: 1000000000,
        tokenAmount: 1000000000,
        periodSeconds: 60 * 5
      });
    }
  }

  async testSubscription() {
    let account = this.state.account;

    //access the extraNonce mapping
    //was getting errors trying to access it normally. Might be an issue with web3 1.0.36
    var slot = '8'.repeat(64); // hex uint256 representation of 0
    var key = account; // hex representation of the key
    let extraNonce = await web3.eth.getStorageAt(
      subscriptionContract._address, // address of the contract to read from
      web3.utils.sha3(key + slot, { encoding: 'hex' }) // keccak256(k . p)
    );

    let nonce = parseInt(extraNonce) + 1;

    /*
    address from, //the subscriber
    address to, //the publisher
    address tokenAddress, //the token address paid to the publisher
    uint256 tokenAmount, //the token amount paid to the publisher
    uint256 periodSeconds, //the period in seconds between payments
    uint256 gasPrice, //the amount of tokens or eth to pay relayer (0 for free)
     */
    const parts = [
      account,
      this.state.toAddress,
      this.state.tokenAddress,
      web3.utils.toTwosComplement(this.state.tokenAmount),
      web3.utils.toTwosComplement(this.state.periodSeconds),
      web3.utils.toTwosComplement(this.state.gasPrice),
      web3.utils.toTwosComplement(nonce)
    ];

    console.log('PARTS', parts);

    const subscriptionHash = await subscriptionContract.methods.getSubscriptionHash(...parts).call();
    console.log('subscriptionHash', subscriptionHash);

    let signature = await web3.eth.personal.sign(subscriptionHash, account);
    console.log('signature', signature);

    const getSubscriptionSigner = await subscriptionContract.methods
      .getSubscriptionSigner(subscriptionHash, signature)
      .call();
    console.log('getSubscriptionSigner', getSubscriptionSigner);
    try {
      // let isReady = await subscriptionContract.methods.isSubscriptionReady(...parts, signature).call();
      // console.log({ isReady });
    } catch (error) {
      console.log(error);
      this.setState({ isReadyError: 'isSubscriptionReady failed - check the console' });
    }

    try {
      let execResult = await subscriptionContract.methods.executeSubscription(...parts, signature).send({
        from: account,
        gas: '2000000'
      });
      console.log({ execResult });
    } catch (error) {
      console.log(error);
      this.setState({ exeError: 'executeSubscription failed - check the console' });
    }
  }

  handleInput = event => {
    const value = event.target.value;
    this.setState({ [event.target.id]: value });
  };

  render() {
    return (
      <div className="App">
        <div>Subscription Test</div>
        <br />
        <div>Subscription from address</div>
        <div>{this.state.account}</div>
        <br />
        <div>
          <div>Subscription to address?</div>
          <input
            type="text"
            id="toAddress"
            placeholder={'0xE28B9FF2b13f8dd3bCb64c4efF04d7361725c855'}
            onChange={e => this.handleInput(e)}
          />
          {this.state.toAddress}
        </div>

        <br />
        <div>Params</div>
        <div>
          <div>tokenAddress</div>
          <input type="text" id="tokenAddress" onChange={e => this.handleInput(e)} />
          {this.state.tokenAddress}
        </div>
        <div>
          <div>gasPrice</div>
          <input type="text" id="gasPrice" onChange={e => this.handleInput(e)} />
          {this.state.gasPrice}
        </div>
        <div>
          <div>tokenAmount</div>
          <input type="text" id="tokenAmount" onChange={e => this.handleInput(e)} />
          {this.state.tokenAmount}
        </div>
        <div>
          <div>periodSeconds</div>
          <input type="text" id="periodSeconds" onChange={e => this.handleInput(e)} />
          {this.state.periodSeconds}
        </div>

        <div>{this.state.account && <button onClick={() => this.testSubscription()}>Run</button>}</div>
        {/* {this.state.isReadyError && <div>{this.state.isReadyError}</div>} */}

        {this.state.exeError && <div>{this.state.exeError}</div>}
      </div>
    );
  }
}

export default App;
