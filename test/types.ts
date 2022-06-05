import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import type { Fixture } from "ethereum-waffle";

import type { Voting } from "../src/types/contracts/Voting";

declare module "mocha" {
  export interface Context {
    voting: Voting;

    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}

export interface Signers {
  owner: SignerWithAddress;
  other: SignerWithAddress;
  voter1: SignerWithAddress;
  voter2: SignerWithAddress;
  voter3: SignerWithAddress;
  voter4: SignerWithAddress;
  voter5: SignerWithAddress;
  voter6: SignerWithAddress;
  voter7: SignerWithAddress;
  voter8: SignerWithAddress;
}
