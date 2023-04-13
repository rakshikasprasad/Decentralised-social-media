//migration files put the smart contracts in the blockchain
// compiles, puts it in the machine readable format for the blockchain

const Decentragram = artifacts.require("Decentragram");

module.exports = function(deployer) {
  deployer.deploy(Decentragram);
};