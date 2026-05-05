// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {DailyCheckIn} from "../src/DailyCheckIn.sol";

contract DailyCheckInTest is Test {
    DailyCheckIn internal c;
    address internal alice = address(0xA11CE);

    function setUp() public {
        c = new DailyCheckIn();
    }

    function test_checkIn_firstTime() public {
        vm.startPrank(alice);
        c.checkIn();
        vm.stopPrank();

        uint256 day = block.timestamp / 86400;
        assertEq(c.lastCheckInDay(alice), day);
        assertEq(c.streak(alice), 1);
    }

    function test_revert_doubleSameDay() public {
        vm.startPrank(alice);
        c.checkIn();
        vm.expectRevert(DailyCheckIn.AlreadyCheckedIn.selector);
        c.checkIn();
        vm.stopPrank();
    }

    function test_revert_nonZeroValue() public {
        vm.deal(alice, 1 ether);
        vm.startPrank(alice);
        vm.expectRevert(DailyCheckIn.ValueNotAllowed.selector);
        c.checkIn{value: 1 wei}();
        vm.stopPrank();
    }

    function test_streak_consecutiveDays() public {
        vm.startPrank(alice);
        c.checkIn();
        vm.warp(block.timestamp + 86400);
        c.checkIn();
        vm.warp(block.timestamp + 86400);
        c.checkIn();
        vm.stopPrank();

        assertEq(c.streak(alice), 3);
    }

    function test_streak_resets_after_gap() public {
        vm.startPrank(alice);
        c.checkIn();
        vm.warp(block.timestamp + 3 * 86400);
        c.checkIn();
        vm.stopPrank();

        assertEq(c.streak(alice), 1);
    }
}
