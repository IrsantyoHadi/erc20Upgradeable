// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract DapsTokenV1 is
    Initializable,
    ERC20Upgradeable,
    UUPSUpgradeable,
    OwnableUpgradeable
{
    address public admin;
    uint256 public minSupply;
    uint256 public capSupply;

    modifier onlyAdmin() {
        require(_msgSender() == admin, "Only Admin: caller is not the admin");
        _;
    }

    // Admin Only Function
    function mint(uint256 _amount) external onlyAdmin {
        require(_amount + totalSupply() <= capSupply, "Exceed max supply");
        _mint(_msgSender(), _amount);
    }

    function burn(uint256 _amount) public onlyAdmin {
        require(totalSupply() - _amount >= minSupply, "Below minimum supply");
        _burn(_msgSender(), _amount);
    }

    // Owner Only Function
    function setAdmin(address _admin) external onlyOwner {
        admin = _admin;
    }

    // Override Function
    function transfer(address to, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        address owner = _msgSender();
        uint256 burnAmount = (amount * 10) / 100;
        uint256 transferAmount = amount - burnAmount;
        burn(burnAmount);
        _transfer(owner, to, transferAmount);
        return true;
    }

    // Initialize function for proxy
    function initialize() public initializer {
        __ERC20_init("DapsToken", "DAP");
        __Ownable_init();
        __UUPSUpgradeable_init();

        admin = _msgSender();
        minSupply = 100000 * 10**decimals();
        capSupply = 1000000 * 10**decimals();
        _mint(_msgSender(), minSupply);
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
