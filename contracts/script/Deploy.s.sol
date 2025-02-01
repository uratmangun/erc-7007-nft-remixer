// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Script} from "forge-std/Script.sol";
import {console} from "forge-std/console.sol";
import {AIGCNFT} from "../src/AIGCNFT.sol";
import {Groth16Verifier} from "../src/Verifier.sol";

contract DeployScript is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        // First deploy the Verifier contract
        Groth16Verifier verifier = new Groth16Verifier();
        console.log("Verifier deployed to:", address(verifier));

        // Then deploy AIGCNFT with the Verifier address
        AIGCNFT nft = new AIGCNFT(address(verifier));
        console.log("AIGCNFT deployed to:", address(nft));

        vm.stopBroadcast();
    }
}
