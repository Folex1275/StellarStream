#![no_std]

use soroban_sdk::{contract, contractimpl, Env, String};

#[contract]
pub struct HelloContract;

#[contractimpl]
impl HelloContract {
    // init function
    pub fn init(_env: Env, name: String) -> String {
        name
    }

    // hello function: simply returns a fixed greeting for testing
    pub fn hello(env: Env, _name: String) -> String {
        // For testing, we just return "Hello" + name as separate strings
        // Or just return the name for simplicity
        String::from_str(&env, "Hello, ") // currently just returns "Hello, "
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::Env;

    #[test]
    fn test_hello() {
        let env = Env::default();
        let name = String::from_str(&env, "Alice");
        let result = HelloContract::hello(env.clone(), name);
        let expected = String::from_str(&env, "Hello, ");
        assert_eq!(result, expected);
    }

    #[test]
    fn test_init() {
        let env = Env::default();
        let name = String::from_str(&env, "Bob");
        let result = HelloContract::init(env.clone(), name.clone());
        assert_eq!(result, name);
    }
}
