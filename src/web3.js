import Web3 from 'web3';

let web3;
if (window && window.web3 && window.web3 !== 'undefined') {
  web3 = new Web3(window.web3.currentProvider);
} else {
  web3 = null;
}

export default web3;
