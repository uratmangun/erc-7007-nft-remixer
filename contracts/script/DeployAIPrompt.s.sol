// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {Prompt} from "../src/AIPrompt.sol";
import "OAO/contracts/interfaces/IAIOracle.sol";

contract DeployAIPrompt is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address aiOracleAddress = vm.envAddress("AI_ORACLE_ADDRESS");
        
        vm.startBroadcast(deployerPrivateKey);
        
        Prompt prompt = new Prompt(IAIOracle(aiOracleAddress));
        
        vm.stopBroadcast();

        console2.log("Prompt deployed to:", address(prompt));
    }
}
