// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";

contract Voting is Ownable {
    mapping(address => bool) private voters;
    mapping(address => Candidate) public candidates;
    address[] internal candidatesList;

    uint256 public closure;
    bool public paused = false;

    struct Candidate {
        uint256 index;
        uint256 count;
        uint256 seniority;
    }

    event Voted(address _voter, address _candidate);
    event Started(uint256 _startedAt, uint256 _endsAt);
    event Finished(address _winner);
    event CandidateAdded(address _address);
    event CandidateRemoved(address _address);

    /**
     * @dev requires that the vote is in progress
     */
    modifier inProgress() {
        require(block.timestamp < closure, "Voting: voting already finished or not yet started");

        _;
    }

    /**
     * @dev requires that the voter hasn't voted
     */
    modifier canVote(address _sender) {
        require(!hasVoted(_sender), "Voting: user has already voted");

        _;
    }

    /**
     * @dev determines whether the voter has voted
     */
    function hasVoted(address _voter) internal view returns (bool) {
        return voters[_voter];
    }

    /**
     * @dev returns a list of all candidates's address
     */
    function getCandidates() external view returns (address[] memory) {
        return candidatesList;
    }

    /**
     * @dev initiates the vote and establishes the clousure
     */
    function start(uint256 _duration) external onlyOwner {
        closure = block.timestamp + _duration;

        emit Started(block.timestamp, closure);
    }

    /**
     * @dev adds a specific candidate to the list
     */
    function addCandidate(address _address, uint256 _seniority) external onlyOwner {
        require(_address != address(0), "Voting: address not valid");
        require(
            candidates[_address].index == 0 && candidates[_address].seniority == 0,
            "Voting: candidate already exist"
        );

        candidatesList.push(_address);
        uint256 index = candidatesList.length - 1;
        candidates[_address] = Candidate(index, 0, _seniority);
        emit CandidateAdded(_address);
    }

    /**
     * @dev removes a specific candidate from list
     *
     * NOTE: this removal has direct access to the list,
     * using index saved into the iterable map, avoiding iterations and saving gas
     */
    function removeCandidate(address _address) external onlyOwner {
        require(candidates[_address].index > 0, "Voting: candidate not found");

        uint256 index = candidates[_address].index;
        candidatesList[index] = candidatesList[candidatesList.length - 1];
        candidatesList.pop();
        delete candidates[_address];
        emit CandidateRemoved(_address);
    }

    /**
     * @dev permits at user to vote his candidate
     */
    function vote(address _candidate) external inProgress canVote(msg.sender) {
        candidates[_candidate].count += 1;
        voters[msg.sender] = true;
        emit Voted(msg.sender, _candidate);
    }

    /**
     * @dev determines the winner of voting
     */
    function winner() external returns (address) {
        require(block.timestamp > closure, "Voting: voting not yet finished");
        address winnerAddress = computeWinnerWithSeniority();

        emit Finished(winnerAddress);
        return winnerAddress;
    }

    /**
     * @dev computes the winner of voting iterating the list of all candidates
     * if there is a parity between candidates, checks the seniority of them and established who prevails
     */
    function computeWinnerWithSeniority() private view returns (address) {
        uint256 maxCount = 0;
        address candidateWithMajority;
        address[] memory _candidatesList = candidatesList;

        for (uint256 i = 0; i < _candidatesList.length; i++) {
            address _address = _candidatesList[i];
            if (candidates[_address].count > maxCount) {
                maxCount = candidates[_address].count;
                candidateWithMajority = _address;
            } else if (candidates[_address].count == maxCount) {
                if (candidates[_address].seniority > candidates[candidateWithMajority].seniority)
                    candidateWithMajority = _address;
            }
        }

        return candidateWithMajority;
    }
}
