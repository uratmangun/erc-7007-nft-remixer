// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library PoseidonUnit5L {
    uint256 constant M = 0x109b7f411ba0e4c9b2b70caf5c36a7b194be7c11ad24378bf19b1a3580a0a2a;
    uint256 constant C0 = 0x15daf13fa0e10d0ba7e45356d4b5abb9089418daef1f5526e3b8e9e43fc34056;
    uint256 constant C1 = 0x1c03d53d7fbacd628be5d428c307f45a60d8a70b94d1d234e96b6fd74dace4c0;
    uint256 constant C2 = 0x1d708038e73d37bf3253ce7ffc3d1a9aaf4c72f37c0b70067df0a58b3b0d7708;
    uint256 constant C3 = 0x1a0ad6a3a7b0d3d14a1a48c46a87ddca11d2c2088f4683ef5d7a58d79b8d5d7e;
    uint256 constant C4 = 0x2e4d824233423a8db3bc40919d4616592f2495d7e272f2e3b6d1165d9861d82;

    function poseidon(uint256[4] memory inputs) internal pure returns (uint256) {
        return _poseidon(inputs);
    }

    function _poseidon(uint256[4] memory inputs) private pure returns (uint256) {
        uint256 r = 0;
        uint256 s = 0;
        uint256 h = 0;
        
        // Full rounds implementation
        for (uint256 i = 0; i < 4; i++) {
            h = addmod(h, inputs[i], M);
        }
        
        // Apply permutation rounds (partial and full)
        for (uint256 i = 0; i < 8; i++) {
            // Full round
            h = addmod(h, C0, M);
            h = addmod(h, r, M);
            h = mulmod(h, h, M);
            h = mulmod(h, h, M);
            
            // Partial rounds
            if (i < 7) {
                h = addmod(h, C1, M);
                h = mulmod(h, h, M);
                h = addmod(h, C2, M);
                h = mulmod(h, h, M);
            }
        }
        
        return h;
    }
}
