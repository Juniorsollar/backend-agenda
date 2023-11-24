const c = 1

function name(a, b){
    //console.log(a)

    function test(){
        return c
    }

    const res =  test()

    return a + b + res
}

const output = name(1,2)
console.log(output)
