// Welcome to https://pylon.bot! You can use this editor to write custom code that Pylon will execute!
// Be sure to check out the documentation here: https://pylon.bot/docs/reference/index.html
// For help, join our Discord server: https://discord.gg/hC6Bbtj
//
// This is the default script, that shows off some examples. Feel free to obliterate all this and start
// from scratch if you know what you're doing!
//
// **FAQ**:
//  - Q: How do I publish my script
//    A: Just press Ctrl + S, and it's published instantly.
//  - Q: What's that black box at the bottom of the editor do?
//    A: That's the console, you can log stuff to it, to help you develop your scripts, just use `console.log()`.
//       Additionally, if your script throws an error, it'll be logged there in real time!
//  - Q: So, I can basically write any code that I want here?
//    A: Yup! Pylon provides an isolated sandbox that runs your script safely. There are some memory and
//       execution time limits you'll have to be aware of. Check out: https://pylon.bot/docs/dev-limits

// Here's an example of how to use the built in command handler.
const commands = new discord.command.CommandGroup({
  defaultPrefix: `)` // You can customize your default prefix here.
});

// A simple command, !ping -> Pong!
commands.raw('help', async (message) => {
  message.reply(`\`\`\`asciidoc
== Counting Thingy ==
)buy <id> :: Buy an upgrade.
)shop     :: See available upgrades.
\`\`\``);
});

async function getAmount(id: Number) {
  const out = (await counting.get(`upg${id}`)) || 0;
  return Number(out);
}

async function getRoundedCosts() {
  const costs = await counting.get('costs');
  return costs.map((cost) => Math.ceil(Number(cost)));
}

commands.raw('shop', async (message) => {
  const costs = await getRoundedCosts();
  const upg1 = await getAmount(1);
  const upg2 = await getAmount(2);
  const upg3 = await getAmount(3);
  message.reply(`\`\`\`asciidoc
== Upgrades ==
1. 2x Mult        (${upg1}) :: ${costs[0]} Number
2. 1 Doublepost   (${upg2}) :: ${costs[1]} Number
3. Prestige       (${upg3}) :: ${costs[2]} Number
4. Super Prestige (0) :: ${costs[3]} Prestiges (NOT IMPLEMENTED)\`\`\``);
});

function clamp(num: Number, min: Number, max: Number) {
  return num <= min ? min : num >= max ? max : num;
}

const scaling = [3, 7, 3, 10000];
commands.on(
  'buy',
  (ctx) => ({ id: ctx.integer() }),
  async (message, { id }) => {
    const costs = (await counting.get('costs')) || [25, 100, 1000, 100];
    let number = (await counting.get('number')) || 1;
    id = clamp(id, 1, 4);
    if (id === 4) {
      message.reply('super prestige is not implemented!');
      return;
    }
    const cost = costs[id - 1];
    if (cost > number) {
      message.reply(
        `your number isn't big enough. (${number}/${Math.ceil(cost)})`
      );
      return;
    }

    let val = (await counting.get(`upg${id}`)) || 0;
    val = Number(val);

    if (id === 3) {
      number = 1;
      costs[0] = 25 / 1.85 ** (val + 1);
      costs[1] = 100 / 1.85 ** (val + 1);
      await counting.put('upg1', 0);
      await counting.put('upg2', 0);
    } else {
      number -= Math.ceil(cost);
    }
    costs[id - 1] *= scaling[id - 1];
    message.reply(`upgrade bought.
number: ${number}`);
    await counting.put('costs', costs);
    await counting.put('number', number);
    await counting.put(`upg${id}`, val + 1);
  }
);

commands.on(
  'eval',
  (ctx) => ({ content: ctx.text() }),
  async (message, { content }) => {
    if (message.member.user.id !== '255757013122809856') return;
    await eval(content);
  }
);

commands.raw('fuckit420', async () => {
  counting.put('upg1', 0);
  counting.put('upg2', 0);
  counting.put('upg3', 8);
  counting.put('number', 1);
  counting.put('costs', [25 / 1.85 ** 9, 100 / 1.85 ** 9, 6561000, 1e100]);
});

const counting = new pylon.KVNamespace('counting');

async function getNumberOnCount() {
  let out = 1;
  const twoXMult = (await counting.get('upg1')) || 0;
  out *= 2 ** Number(twoXMult);
  return out;
}

// Finally, an example of "raw" message handling, without using the command handler.
// Here, we're checking to see if the message contains the string "ayy", and if it does,
// we'll reply with "lmao".
discord.on('MESSAGE_CREATE', async (message) => {
  if (
    message.channelId !== '670813340670361600' ||
    message.content.startsWith(')') ||
    message.content.startsWith('//')
  )
    return;
  let number = (await counting.get('number')) || 1;
  number = Number(number);

  if (!message.content.startsWith(String(number))) {
    const onCount = await getNumberOnCount();
    await message.reply(
      `messages must start with ${number}. comments can go after the number. (increment is ${onCount})`
    );
    await message.delete();
    return;
  }

  const countee = (await counting.get('lastCounter')) || '0';
  const counteeTimes = (await counting.get('lastCounterTimes')) || 1;
  const upg2 = (await counting.get('upg2')) || 0;

  if (countee === message.member.user.id && counteeTimes > upg2) {
    await message.reply(`no doubleposting!`);
    await message.delete();
    return;
  }

  const plus = await getNumberOnCount();
  number += plus;
  await counting.put('number', number);
  await counting.put('lastCounter', message.member.user.id);
  await counting.put(
    'lastCounterTimes',
    countee === message.member.user.id ? counteeTimes + 1 : 0
  );
  const channel = await message.getChannel();
  channel.edit({
    topic: `next count: ${number}`
  });
});

// There are many, many more events you can listen for with Pylon. For more, check out:
// https://pylon.bot/docs/reference/modules/discord.html#on

// This marks the end of the default script. From here, you can customize Pylon however you want.
// The possibilities are literally endless. If you encounter bugs, need help, or want to share what
// you've built. Join the Pylon discord. The invite link is here: https://discord.gg/hC6Bbtj
