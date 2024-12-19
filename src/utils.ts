export function random(len: number){
    let options = "qwertyuiopasdfghjklzxcvbnm123456789";
    let length = options.length;

    let ans = "";
    for(let i = 0; i < len; i++) {
        ans += options[Math.floor(Math.random() * length)]
    }
    return ans;
}
//Math.random will give me a no between 0 - 1
// multiply it with length like 0.1*10 => 1
// 0.23 * 10 => 2.3  => 2
// get that index and use it in ans
// it will generate a random string