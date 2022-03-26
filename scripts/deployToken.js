const { ethers, upgrades } = require('hardhat');

async function main() {
  const DapsTokenV1 = await ethers.getContractFactory('DapsTokenV1');

  console.log('Deploying Daps Token...');

  const dapsToken = await upgrades.deployProxy(DapsTokenV1, [], {
    initializer: 'initialize',
  });
  await dapsToken.deployed();

  console.log('Daps Token deployed to:', dapsToken.address);
}

main();
