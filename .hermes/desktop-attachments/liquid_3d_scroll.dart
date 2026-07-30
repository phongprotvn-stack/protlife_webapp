import 'package:flutter/material.dart';
import 'dart:math' as math;

void main() => runApp(const MaterialApp(home: Liquid3DScrollScreen()));

class Liquid3DScrollScreen extends StatefulWidget {
  const Liquid3DScrollScreen({super.key});

  @override
  State<Liquid3DScrollScreen> createState() => _Liquid3DScrollScreenState();
}

class _Liquid3DScrollScreenState extends State<Liquid3DScrollScreen> {
  late FixedExtentScrollController _scrollController;
  double _scrollOffset = 0.0;

  @override
  void initState() {
    super.initState();
    _scrollController = FixedExtentScrollController();
    _scrollController.addListener(() {
      setState(() {
        // Cập nhật vị trí cuộn để tính toán hiệu ứng
        _scrollOffset = _scrollController.offset / 150; // 150 là itemExtent
      });
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 1. Hiệu ứng Gooey (Dính) giả lập bằng ShaderMask hoặc Blur
          // Ở mức độ cơ bản, chúng ta dùng ListWheelScrollView làm lõi
          Center(
            child: ListWheelScrollView.useDelegate(
              controller: _scrollController,
              itemExtent: 150,
              perspective: 0.003, // 3D Perspective (Độ nghiêng 3D)
              diameterRatio: 1.8, // Quỹ đạo cong
              physics: const FixedExtentScrollPhysics(),
              childDelegate: ListWheelChildBuilderDelegate(
                childCount: 20,
                builder: (context, index) {
                  return AnimatedItem(
                    index: index,
                    scrollOffset: _scrollOffset,
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class AnimatedItem extends StatelessWidget {
  final int index;
  final double scrollOffset;

  const AnimatedItem({
    super.key,
    required this.index,
    required this.scrollOffset,
  });

  @override
  Widget build(BuildContext context) {
    // Tính toán khoảng cách từ item đến tâm màn hình
    final difference = (index - scrollOffset);
    
    // 2. Tính toán Scale và Opacity dựa trên vị trí
    final double scale = 1 - (difference.abs() * 0.15).clamp(0.0, 0.5);
    final double opacity = 1 - (difference.abs() * 0.3).clamp(0.0, 1.0);
    
    // 3. Tính toán độ lệch X (Quỹ đạo cong bổ trợ)
    final double xOffset = math.pow(difference.abs(), 1.5) * 15;

    return Opacity(
      opacity: opacity,
      child: Transform(
        transform: Matrix4.identity()
          ..setEntry(3, 2, 0.001) // Perspective
          ..translate(xOffset, 0.0, 0.0) // Đẩy sang phải khi ở giữa (hoặc ngược lại)
          ..scale(scale),
        alignment: Alignment.centerLeft,
        child: Container(
          margin: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            children: [
              const SizedBox(width: 40),
              // Hình tròn (Album Art)
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [Colors.purple, Colors.blue.shade900],
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.blue.withOpacity(0.3),
                      blurRadius: 20,
                      spreadRadius: 5,
                    )
                  ],
                ),
                child: const Icon(Icons.music_note, color: Colors.white, size: 40),
              ),
              const SizedBox(width: 20),
              // Văn bản (Text) cũng bị ảnh hưởng bởi transform
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Song Title $index',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Text(
                    'Artist Name',
                    style: TextStyle(color: Colors.grey, fontSize: 14),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
