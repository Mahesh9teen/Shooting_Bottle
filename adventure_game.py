#!/usr/bin/env python3
import random
import sys


def choose(prompt, options):
    """Prompt the player to choose one of the provided options.
    `options` is a list of (key, description) tuples where `key` is
    the string the player may type (case-insensitive).
    """
    keys = {k.lower(): desc for k, desc in options}
    while True:
        print()
        for k, desc in options:
            print(f"  {k}) {desc}")
        choice = input(f"{prompt} ").strip().lower()
        if choice in keys:
            return choice
        print("Invalid choice — try again.")


def intro():
    print("\n-- URBAN OPERATION: NIGHTFALL --\n")
    print("You are Alex, a lone operative on a mission to stop an armed gang.")
    print("Make fast decisions — they affect whether you survive the night.")


def pick_weapon():
    print("\nChoose your weapon:")
    options = [
        ("1", "Pistol — balanced, reliable (medium accuracy, low damage)."),
        ("2", "Rifle  — high damage, lower mobility (high damage, medium accuracy)."),
        ("3", "Shotgun — devastating at close range (high damage, low accuracy)."),
    ]
    w = choose("Pick 1/2/3:", options)
    if w == "1":
        return {"name": "Pistol", "acc": 0.7, "dmg": (15, 25)}
    if w == "2":
        return {"name": "Rifle", "acc": 0.6, "dmg": (25, 40)}
    return {"name": "Shotgun", "acc": 0.5, "dmg": (30, 50)}


def encounter_enemy(weapon):
    print("\nYou slip into the warehouse and spot two enemies guarding a crate.")
    print("Decision 1: How do you approach?")
    options = [
        ("a", "Sneak in quietly and try to take one by surprise."),
        ("b", "Rush in guns blazing — take them before they react."),
        ("c", "Use distraction: throw a small charge to draw them away.")
    ]
    approach = choose("Choose a/b/c:", options)

    if approach == "a":
        success = random.random() < (weapon["acc"] + 0.15)
        if success:
            print("You silent-takedown the first guard and remain undetected.")
            return "cleared"
        else:
            print("You get caught mid-move — a firefight starts!")
            return "fight"

    if approach == "b":
        # Aggressive approach; higher chance of injury but can finish quickly
        hit_both = random.random() < weapon["acc"] * 0.9
        if hit_both:
            print("Your burst hits both enemies. They go down.")
            return "cleared"
        else:
            print("The enemies return fire; you're hit but still standing.")
            return "fight_injured"

    # approach == 'c'
    print("You throw a charge; one enemy investigates the noise.")
    sneaks_success = random.random() < 0.8
    if sneaks_success:
        print("You ambush the lone guard while the other is distracted.")
        return "cleared"
    else:
        print("The distraction fails — the enemies are alerted.")
        return "fight"


def fight_sequence(weapon, status):
    health = 100
    if status == "fight_injured":
        health -= 30
    print(f"\nFight begins. Your health: {health}")

    # Decision 2: Aim or suppress
    print("Decision 2: What's your tactic now?")
    options = [
        ("1", "Aim for center mass — safer, reliable chance to stop them."),
        ("2", "Take risky headshots — higher reward but lower chance."),
        ("3", "Lay down suppressive fire and retreat to cover."),
    ]
    tactic = choose("Pick 1/2/3:", options)

    if tactic == "3":
        # Retreat + chance to call backup or escape
        print("You retreat to cover and call for a drone strike as support.")
        drone = random.random() < 0.6
        if drone:
            print("Drone hits the warehouse; enemies incapacitated. You survive.")
            return "survived"
        else:
            print("Support delayed — you get pinned down and take damage.")
            health -= 50

    elif tactic == "2":
        # headshot attempt
        chance = weapon["acc"] - 0.2
        if random.random() < chance:
            print("Critical headshot! The enemy threat is neutralized instantly.")
            return "survived"
        else:
            print("You miss the precise shot; enemies return fire heavily.")
            health -= 60

    else:
        # center mass
        chance = weapon["acc"]
        if random.random() < chance:
            print("You land solid shots — enemies are down, but you're grazed.")
            health -= 20
            return "survived"
        else:
            print("You fail to suppress effectively; it's a close fight.")
            health -= 40

    # Decision 3: Final choice based on remaining health
    if health <= 0:
        print("You succumb to your wounds. The mission fails.")
        return "dead"

    print(f"After the exchange, your health is {health}.")
    print("Decision 3: Final move — what do you do?")
    options = [
        ("a", "Chase the remaining enemies into the dark."),
        ("b", "Hold position and treat wounds; wait for backup."),
        ("c", "Smoke and flank — risky but might end it."),
    ]
    final = choose("Choose a/b/c:", options)

    if final == "b":
        # Wait for backup; chance of success depends on health
        rescue = random.random() < (0.5 + health / 200)
        if rescue:
            print("Backup arrives and secures the area. You live to see extraction.")
            return "survived_with_support"
        else:
            print("Backup is delayed; enemies swarm your position.")
            return "dead"

    if final == "a":
        chase_win = random.random() < (0.4 + weapon["acc"]/3)
        if chase_win:
            print("You catch the last enemy off-guard and end the threat.")
            return "heroic_survival"
        else:
            print("The chase leads into an ambush. You're outnumbered.")
            return "dead"

    # final == 'c'
    flank = random.random() < (0.45 + weapon["acc"]/4)
    if flank:
        print("Your flank works — you eliminate the remaining hostiles and secure the crate.")
        return "victory_loot"
    else:
        print("The smoke fails; you get caught exposed and take a fatal hit.")
        return "dead"


def cleared_path(weapon):
    print("\nWith the guards down, you approach the crate. It's ticking — an explosive device.")
    print("Decision 2: How do you handle the crate?")
    options = [
        ("1", "Attempt to disarm it carefully."),
        ("2", "Kick it away and get clear — risky but fast."),
        ("3", "Call for demolition support and shelter.")
    ]
    d2 = choose("Pick 1/2/3:", options)

    if d2 == "3":
        print("Demolition clears the device from range. Mission success, but extraction delayed.")
        return "safe_but_late"

    if d2 == "2":
        kicked = random.random() < 0.5
        if kicked:
            print("You kick the crate into a safe area; it detonates away from you.")
            return "victory_smash"
        else:
            print("The crate detonates prematurely — you're badly hurt.")
            return "dead"

    # d2 == '1'
    skill = 0.6
    if random.random() < skill:
        print("You successfully disarm the device and secure the intel from the crate.")
        return "intel_gained"
    else:
        print("A wire slips — the device detonates. You don't make it.")
        return "dead"


def summarize(outcome):
    print("\n--- MISSION OUTCOME ---")
    endings = {
        "dead": "You died on the mission. The city will remember the silence.",
        "survived": "You survived the fight and escaped with minor injuries.",
        "survived_with_support": "You survived with backup — mission partially successful.",
        "heroic_survival": "You eliminated the threat alone and lived — heroic ending.",
        "victory_loot": "You secured the crate and the intel inside — victory.",
        "safe_but_late": "You secured the device safely but missed a chance to intercept the gang.",
        "victory_smash": "You diverted the explosion and survived — mission success.",
        "intel_gained": "You disarmed the device and recovered vital intel — excellent outcome.",
    }
    print(endings.get(outcome, "The mission ended in an unknown way."))


def main():
    intro()
    while True:
        weapon = pick_weapon()
        print(f"\nYou equip the {weapon['name']} and move in.")

        first = encounter_enemy(weapon)

        if first == "cleared":
            outcome = cleared_path(weapon)
        elif first in ("fight", "fight_injured"):
            outcome = fight_sequence(weapon, first)
        else:
            outcome = "dead"

        summarize(outcome)

        again = input("\nPlay again? (y/n): ").strip().lower()
        if again != "y":
            print("Goodbye — thanks for playing.")
            break


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterrupted. Exiting.")
        sys.exit(0)
