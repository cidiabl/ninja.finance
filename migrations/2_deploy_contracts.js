var NinjaToken = artifacts.require("NinjaToken.sol");
var CatnipToken = artifacts.require("CatnipToken.sol");

module.exports = async function(deployer) {
    await deployer.deploy(NinjaToken, { gas: 7000000 })
    await deployer.deploy(CatnipToken, { gas: 7000000 })
}