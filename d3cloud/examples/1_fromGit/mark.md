##关于词云的研究
###词云的资源
* [github项目](https://github.com/jasondavies/d3-cloud)
* [词云示例](https://www.jasondavies.com/wordcloud/)
* [工作原理](https://www.jasondavies.com/wordcloud/about/)

###笔记

这是第一个研究的样例，因为项目需求有用到词云，但是原作者的词云实现的功能不能满足我们的需求，原作者的词云只能根据你输入的数据做
一个随机位置的词云，词的大小、字体、颜色、旋转随机角度方位等可以更改，但是词的位置无法由我们去修改，而项目恰恰有这个小需求，
于是就去研究了下原作者的源代码...

一开始就看作者的源代码，于是便踩坑了，一堆位的运算符，建议想要研究的同学可以看下以下这些资源，有些是原作者写的算法原理，有些是别人
整理的思路

* [How the Word Cloud Generator Works](https://www.jasondavies.com/wordcloud/about/)
* [云标签，关键字图排版 html5](http://blogread.cn/it/article/5457?f=sa)

首先一个问题是单词碰撞的问题，可能除了SVG的font之外，我们无法通过DOM去获取精确的符号形状，还有一种方法是通过canvas写入单词，然后再获得每个像素的数据

这里有一个性能问题，通过一个个的单词写入再获取存在很大的性能问题，如何一次性写入更多是一个问题

而wordle的实现者表示他结合了层次包围盒和四叉树实现合理的速度，原文如下
>Wordle uses a combination of hierarchical bounding boxes and quadtrees to achieve reasonable speeds.

那么两个名词到底是什么意思呢，通过谷歌和百度，找到了一些资料：

* [hierarchical bounding boxes](http://www.docin.com/p-756130910.html)
* [a quadtree spatial index](http://blog.csdn.net/zhouxuguang236/article/details/12312099) 
* [层次包围盒from维基百科](https://en.wikipedia.org/wiki/Bounding_volume_hierarchy)
* 
总的来说层次包围盒是一个适合检测图像碰撞的算法，而四叉树可以用来在二维图片中定位像素
>四叉树是在二维图片中定位像素的唯一适合的算法。因为二维空间（图经常被描述的方式）中，平面像素可以重复的被分为四部分，树的深度由图片、计算机内存和图形的复杂度决定。


根据作者的解释再一次阅读github上面的代码，我下载了最原始的版本，并对源代码进行了阅读，目前理解了大部分，还有一小部分仍旧读不懂，涉及了较多的知识，作者又没有做具体的代码注释，只能尽可能地理解之~~