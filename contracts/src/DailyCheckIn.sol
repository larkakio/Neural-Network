// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice One L2 check-in per UTC day bucket (`block.timestamp / 86400`). Gas only — `msg.value` must be zero.
contract DailyCheckIn {
    /// @dev Stored value is `dayIndex + 1` so `0` unambiguously means “never checked”.
    mapping(address => uint256) private lastCheckInDayStored;
    mapping(address => uint256) public streak;

    event CheckedIn(address indexed user, uint256 dayIndex, uint256 newStreak);

    error ValueNotAllowed();
    error AlreadyCheckedIn();

    function lastCheckInDay(address user) external view returns (uint256 dayIndex) {
        uint256 s = lastCheckInDayStored[user];
        return s == 0 ? 0 : s - 1;
    }

    function checkIn() external payable {
        if (msg.value != 0) revert ValueNotAllowed();

        uint256 dayIndex = block.timestamp / 86400;
        uint256 stored = lastCheckInDayStored[msg.sender];
        uint256 lastDay = stored == 0 ? type(uint256).max : stored - 1;
        if (lastDay == dayIndex) revert AlreadyCheckedIn();

        uint256 newStreak = 1;
        if (stored != 0 && lastDay == dayIndex - 1) {
            newStreak = streak[msg.sender] + 1;
        }

        streak[msg.sender] = newStreak;
        lastCheckInDayStored[msg.sender] = dayIndex + 1;

        emit CheckedIn(msg.sender, dayIndex, newStreak);
    }
}
