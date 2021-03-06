/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
           ______     ______     ______   __  __     __     ______
          /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
          \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
           \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
            \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
  for a user.

# RUN THE BOT:

  Get a Bot token from Slack:

    -> http://my.slack.com/services/new/bot

  Run your bot from the command line:

    token=<MY TOKEN> node slack_bot.js

# USE THE BOT:

  Find your bot inside Slack to send it a direct message.

  Say: "Hello"

  The bot will reply "Hello!"

  Say: "who are you?"

  The bot will tell you its name, where it running, and for how long.

  Say: "Call me <nickname>"

  Tell the bot your nickname. Now you are friends.

  Say: "who am I?"

  The bot will tell you your nickname, if it knows one for you.

  Say: "shutdown"

  The bot will ask if you are sure, and then shut itself down.

  Make sure to invite your bot into other channels using /invite @<my bot>!

# EXTEND THE BOT:

  Botkit has many features for building cool and useful bots!

  Read all about it here:

    -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

const Botkit = require('./lib/Botkit.js');
const os = require('os');
const client = require('cheerio-httpcli');
const CronJob = require('cron').CronJob;
const axios = require('axios')
const qs = require('qs');


var controller = Botkit.slackbot({
    debug: false,
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();

var talkContext = null;

const talkApiKey = process.env.talkApiKey;
const taklApiUrl = 'https://api.apigw.smt.docomo.ne.jp/dialogue/v1/dialogue';

/**
 * 共通処理
 */
// メッセージが含まれるかチェック
function checkMsg(message, targets) {
  var isMatch = false;
  targets.forEach(function(target){
    if (message.text.indexOf(target) != -1) {
      isMatch =  true;
      return true;
    };
  });
  return isMatch;
}
// メッセージをランダムで返却する
function getMsg(messages) {
  var rand = Math.floor( Math.random() * messages.length );
  return messages[rand];
}


/**
 * (all message)
 * 各メッセージに対応したreplyをする
 */
controller.hears([''], 'ambient', function(bot, message) {
  // 名前に反応する
  if (checkMsg(message, ['幸村', 'ゆきむら', 'ユキムラ', '真田', 'さなだ', 'サナダ'])) {
    var rtnMsg = '呼んだ？';
    bot.reply(message, rtnMsg);
  }
  // 承認
  if (checkMsg(message, ['了解', '承知'])) {
    var rtnMsg = getMsg(['フルコミットで頼む！', 'ASAPで頼む！']);
    bot.reply(message, rtnMsg);
  }
  // 思い
  if (checkMsg(message, ['思う', '思います'])) {
    var rtnMsg = 'それ、アグリー';
    bot.reply(message, rtnMsg);
  }
  // 依頼
  if (checkMsg(message, ['確認お願い', 'チェックお願い'])) {
    var rtnMsg = getMsg(['フルコミットで頼む！', 'プライオリティ高めで！', 'コンピテンシーあるねー']);
    bot.reply(message, rtnMsg);
  }
  // 笑い
  if (checkMsg(message, ['ww'])) {
    var rtnMsg = 'ワロタwww';
    bot.reply(message, rtnMsg);
  }

});


/**
 * google
 * Google検索
 */
controller.hears(['google'], 'direct_message,direct_mention,mention', function(bot, message) {
  var msg = message.text.replace( /google\s/g , "" );

  // Googleで「node.js」について検索する。
  client.fetch('http://www.google.com/search', { q: msg }, function (err, $, res) {
    // リンク一覧を表示
    var rtnMsg = "";
    var count = 1;
    $('.g').each(function (idx) {
      var target = $(this).find('h3').children('a').text();
      if (typeof target !== "undefined" && count <= 5) {
        rtnMsg += "【" + count + "】" + target + "  ";
        rtnMsg += $(this).find('h3').children('a').attr('href') + "\n";
        count += 1;
      }
    });
    bot.reply(message, rtnMsg);
  });
});


/**
 * totsuzen
 * 突然死ジェネレーター
 */
controller.hears(['totsuzen'], 'direct_message,direct_mention,mention', function(bot, message) {

  String.prototype.lengthByte = function() {
    var c, i, j, r, ref, str;
    str = this;
    r = 0;
    for (i = j = 0, ref = str.length - 1; 0 <= ref ? j <= ref : j >= ref; i = 0 <= ref ? ++j : --j) {
      c = str.charCodeAt(i);
      if ((c >= 0x0 && c < 0x81) || (c === 0xf8f0) || (c >= 0xff61 && c < 0xffa0) || (c >= 0xf8f1 && c < 0xf8f4)) {
        r += 1;
      } else {
        r += 2;
      }
    }
    return r;
  };

  String.prototype.repeat = function(n) {
    return new Array(n + 1).join(this);
  };

  var msgArray = message.text.split(" ");
  if (msgArray.length > 1) {
    var str = msgArray[1] + "！";
    var len = Math.floor(str.lengthByte() / 2);
    var rtnMsg = "";
    rtnMsg += "＿" + ("人".repeat(len + 2)) + "＿\n";
    rtnMsg += "＞　" + str + "　＜\n";
    rtnMsg += "￣" + ("Ｙ".repeat(len + 2)) + "￣";
    bot.reply(message, rtnMsg);
  }
});


/**
 * hello
 * Helloと返す
 */
controller.hears(['hello', 'hi', 'やあ', 'やぁ', 'おっす', 'オッス'], 'direct_message,direct_mention,mention', function(bot, message) {

    // bot.api.reactions.add({
    //     timestamp: message.ts,
    //     channel: message.channel,
    //     name: 'robot_face',
    // }, function(err, res) {
    //     if (err) {
    //         bot.botkit.log('Failed to add emoji reaction :(', err);
    //     }
    // });

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'ｵｯｽ ' + user.name + '!!');
        } else {
            bot.reply(message, 'ｵｯｽ, ｵﾗﾕｷﾑﾗ!!');
        }
    });
});


/**
 * call me
 * 自分の名前を設定する
 */
controller.hears(['call me (.*)', 'my name is (.*)'], 'direct_message,direct_mention,mention', function(bot, message) {
    var name = message.match[1];
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
});


/**
 * what is my name
 * 設定した自分の名前を確認する
 */
controller.hears(['what is my name', 'who am i'], 'direct_message,direct_mention,mention', function(bot, message) {

    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Your name is ' + user.name);
        } else {
            bot.startConversation(message, function(err, convo) {
                if (!err) {
                    convo.say('I do not know your name yet!');
                    convo.ask('What should I call you?', function(response, convo) {
                        convo.ask('You want me to call you `' + response.text + '`?', [
                            {
                                pattern: 'yes',
                                callback: function(response, convo) {
                                    // since no further messages are queued after this,
                                    // the conversation will end naturally with status == 'completed'
                                    convo.next();
                                }
                            },
                            {
                                pattern: 'no',
                                callback: function(response, convo) {
                                    // stop the conversation. this will cause it to end with status == 'stopped'
                                    convo.stop();
                                }
                            },
                            {
                                default: true,
                                callback: function(response, convo) {
                                    convo.repeat();
                                    convo.next();
                                }
                            }
                        ]);

                        convo.next();

                    }, {'key': 'nickname'}); // store the results in a field called nickname

                    convo.on('end', function(convo) {
                        if (convo.status == 'completed') {
                            bot.reply(message, 'OK! I will update my dossier...');

                            controller.storage.users.get(message.user, function(err, user) {
                                if (!user) {
                                    user = {
                                        id: message.user,
                                    };
                                }
                                user.name = convo.extractResponse('nickname');
                                controller.storage.users.save(user, function(err, id) {
                                    bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
                                });
                            });



                        } else {
                            // this happens if the conversation ended prematurely for some reason
                            bot.reply(message, 'OK, nevermind!');
                        }
                    });
                }
            });
        }
    });
});


/**
 * shutdown
 * botをシャットダウンする
 */
controller.hears(['shutdown'], 'direct_message,direct_mention,mention', function(bot, message) {

    bot.startConversation(message, function(err, convo) {

        convo.ask('Are you sure you want me to shutdown?', [
            {
                pattern: bot.utterances.yes,
                callback: function(response, convo) {
                    convo.say('Bye!');
                    convo.next();
                    setTimeout(function() {
                        process.exit();
                    }, 3000);
                }
            },
        {
            pattern: bot.utterances.no,
            default: true,
            callback: function(response, convo) {
                convo.say('*Phew!*');
                convo.next();
            }
        }
        ]);
    });
});


/**
 * uptime
 * botの詳細情報を取得する
 */
controller.hears(['uptime', 'identify yourself', 'who are you', 'what is your name'],
    'direct_message,direct_mention,mention', function(bot, message) {

        var hostname = os.hostname();
        var uptime = formatUptime(process.uptime());

        bot.reply(message,
            ':robot_face: I am a bot named <@' + bot.identity.name +
             '>. I have been running for ' + uptime + ' on ' + hostname + '.');

    });

function formatUptime(uptime) {
    var unit = 'second';
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'minute';
    }
    if (uptime > 60) {
        uptime = uptime / 60;
        unit = 'hour';
    }
    if (uptime != 1) {
        unit = unit + 's';
    }

    uptime = uptime + ' ' + unit;
    return uptime;
}


/**
 * chat
 * Call Talk API
 */
controller.hears([''], 'direct_message,direct_mention,mention', function(bot, message) {
    var params = {
        utt: message.text,
        context: talkContext,
        t: 20
    };

    axios.post(taklApiUrl + '?APIKEY=' + talkApiKey, params)
    .then(function (response) {
        talkContext = response.data.context;
        bot.reply(message, response.data.utt);
    })
    .catch(function (error) {
        let rtnMsg = 'エラーだぞ！';
        bot.reply(message, rtnMsg);
    });

});


/**
 * cron
 * 定期処理を実行する
 */
var cron = new CronJob({
  cronTime: '00 9 * * *', // 毎日9時に実行
  onTick: function() {

    // 今日の日付を取得
    var today = new Date();
    var month = ("0" + (today.getMonth() + 1)).substr(-2);
    var date = ("0" + today.getDate()).substr(-2);
    // Googleで「node.js」について検索する。
    client.fetch('http://www.d4.dion.ne.jp/~warapon/data04/death-'+month+date+'.htm', function (err, $, res) {

        var rtnMsg = "";
        var names = [];
        var birth = [];
        var briefs = [];

        // 名称一覧を取得
        $('#total-box').find('dd.hu1, dd.hu2, dd.hu3').each(function (idx) {
        names.push($(this).text());
        })
        // 誕生日一覧を取得
        $('#total-box').find('dt').each(function (idx) {
        birth.push($(this).text());
        })
        // 誕生日一覧を取得
        $('#total-box').find('dd.pf').each(function (idx) {
        briefs.push($(this).text());
        })

        // ランダム変数
        randomIdx = Math.floor(Math.random() * Math.random() * names.length);
        let idx = randomIdx === names.length ? randomIdx - 1 : randomIdx;
        // メッセージ作成
        rtnMsg = "おっす、おらユキムラ！\n";
        rtnMsg += "今日は" + names[idx] + "の命日だぞ！" + "\n";
        rtnMsg += ">" + briefs[idx] + "\n";
        rtnMsg += ">" + birth[idx];

        // botが発言する
        bot.say({
        // channel: 'C0F9390F5', // rekishoku: test
        channel: process.env.CHANNEL_ID,
        text: rtnMsg,
        as_user: true,
        link_names: 1
        }, function(err) {
        if (err) {
            bot.botkit.log(err);
        }
        });

    });

  },
  start: false,
  timeZone: 'Asia/Tokyo'
});
cron.start();