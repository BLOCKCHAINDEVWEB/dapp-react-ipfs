/* SPDX-License-Identifier: MIT */
pragma solidity ^0.8.0;


contract Ipfs {
  string ipfsHash;

  function sendHash(string memory x) public {
    ipfsHash = x;
  }

  function getHash() public view returns (string memory x) {
    return ipfsHash;
  }
}

// https://kovan.etherscan.io/tx/0x245fcfefb9fa5b56834cfd07a4b4334036c95e3089f0d578441fa1b9ff9cb2a6
// 0xdB238259407A537CA73f3BC6e9Cba13a786D616b account
// 0xf5e5984c3cfE123a1A7dA46dD9dC9d3E4fB89dc6 contract address on kovan
// deployed using remix 
