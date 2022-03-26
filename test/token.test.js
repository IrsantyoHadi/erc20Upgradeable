const { ethers, upgrades } = require('hardhat');
const { expect } = require('chai');

describe('DapsTokenV1', function () {
  let proxyContract;
  it('deploys', async function () {
    const MyTokenV1 = await ethers.getContractFactory('DapsTokenV1');
    proxyContract = await upgrades.deployProxy(MyTokenV1, { kind: 'uups', initializer: 'initialize' });
    await proxyContract.deployed();
    console.log('deployed to proxy:', proxyContract.address);
  });

  const adminMinting = async (amount) => {
    await proxyContract.mint(ethers.utils.parseEther(amount));
  };

  describe('minting, burning, transfer flow', () => {
    it('should mint if user admin', async function () {
      let [owner] = await ethers.getSigners();
      const expectedBalance = ethers.utils.parseEther('100100.0');

      await proxyContract.mint(ethers.utils.parseEther('100.0'));
      const ownerBalance = await proxyContract.balanceOf(owner.address);

      expect(Number(ownerBalance)).to.equal(Number(expectedBalance));
    });

    it('should reverted if mint from other address', async function () {
      let [_, acc1] = await ethers.getSigners();
      const mintTx = proxyContract.connect(acc1).mint(ethers.utils.parseEther('100.0'));

      await expect(mintTx).to.be.revertedWith('Only Admin: caller is not the admin');
    });

    it('should reverted if mint exceed max supply', async function () {
      const mintTx = proxyContract.mint(ethers.utils.parseEther('10000000.0'));

      await expect(mintTx).to.be.revertedWith('Exceed max supply');
    });

    it('should burn if user admin', async function () {
      let [owner] = await ethers.getSigners();
      const expectedBalance = ethers.utils.parseEther('100000.0');

      await proxyContract.burn(ethers.utils.parseEther('100.0'));
      const ownerBalance = await proxyContract.balanceOf(owner.address);

      expect(Number(ownerBalance)).to.equal(Number(expectedBalance));
    });

    it('should reverted if user not admin', async function () {
      let [_, acc1] = await ethers.getSigners();
      const burnTx = proxyContract.connect(acc1).burn(ethers.utils.parseEther('100.0'));

      await expect(burnTx).to.be.revertedWith('Only Admin: caller is not the admin');
    });

    it('should reverted when total supply after burning less than min supply', async function () {
      const burnTx = proxyContract.burn(ethers.utils.parseEther('100.0'));

      await expect(burnTx).to.be.revertedWith('Below minimum supply');
    });

    it('should reverted when transfer burn amount make total supply less min supply', async function () {
      let [_, acc1] = await ethers.getSigners();
      const transferAmount = ethers.utils.parseEther('100.0');
      const transferTx = proxyContract.transfer(acc1.address, transferAmount);

      await expect(transferTx).to.be.revertedWith('Below minimum supply');
    });

    it('should transfer if total supply after burn amount is more than min supply', async function () {
      await adminMinting('100.0');
      let [owner, acc1] = await ethers.getSigners();
      const transferAmount = ethers.utils.parseEther('1');
      const expectedTransferBalance = ethers.utils.parseEther('0.9');
      const expectedOwnerBalance = ethers.utils.parseEther('100099.0');

      await proxyContract.transfer(acc1.address, transferAmount);

      const ownerBalance = await proxyContract.balanceOf(owner.address);
      const acc1Balance = await proxyContract.balanceOf(acc1.address);

      expect(Number(acc1Balance)).to.equal(Number(expectedTransferBalance));
      expect(Number(ownerBalance)).to.equal(Number(expectedOwnerBalance));
    });
  });

  describe('setup admin', () => {
    it('should setup new admin when caller is contract owner', async () => {
      let [_, acc1] = await ethers.getSigners();
      await proxyContract.setAdmin(acc1.address);

      const adminAddress = await proxyContract.admin();

      expect(adminAddress).to.equal(acc1.address);
    });
  });
});
