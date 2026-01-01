// 定时任务配置
import cron from 'node-cron';
import prisma from '../prisma/index.js';

// 每5分钟扫描一次过期卡片
const scanExpiredCards = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('开始扫描过期卡片...');
    try {
      // 获取当前时间
      const now = new Date();
      
      // 查询所有已过期但未提醒的卡片
      const expiredCards = await prisma.card.findMany({
        where: {
          dueDate: {
            lte: now
          }
        },
        include: {
          list: {
            include: {
              board: {
                include: {
                  owner: {
                    select: {
                      username: true,
                      email: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (expiredCards.length > 0) {
        console.log(`发现 ${expiredCards.length} 张过期卡片:`);
        
        // 输出提醒事件
        expiredCards.forEach(card => {
          console.log(`[提醒] 卡片 "${card.title}" 已过期`);
          console.log(`  - 所属看板: ${card.list.board.title}`);
          console.log(`  - 所属列表: ${card.list.title}`);
          console.log(`  - 负责人: ${card.list.board.owner.username} (${card.list.board.owner.email})`);
          console.log(`  - 过期时间: ${card.dueDate}`);
        });
      } else {
        console.log('未发现过期卡片');
      }
    } catch (error) {
      console.error('扫描过期卡片时发生错误:', error);
    }
  });
};

export default scanExpiredCards;
