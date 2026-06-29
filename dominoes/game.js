function calculateBranch(deck, startDirection) {
    const layoutMap = {};
    
    let headX = 1400; 
    let headY = TRACK.bottomY;
    
    // Vector states: Left=[-1,0], Right=[1,0], Up=[0,-1], Down=[0,1]
    let vector = (startDirection === 'left') ? [-1, 0] : [1, 0];
    let prevTile = null;

    deck.forEach((tile, index) => {
        let isMovingHorizontal = vector[1] === 0;
        
        // Dynamic orientation based on active path vector direction
        let width, height, angle;
        if (tile.isDouble) {
            width = isMovingHorizontal ? TILE_BASE_W : TILE_BASE_H;
            height = isMovingHorizontal ? TILE_BASE_H : TILE_BASE_W;
            angle = isMovingHorizontal ? 0 : 90;
        } else {
            width = isMovingHorizontal ? TILE_BASE_H : TILE_BASE_W;
            height = isMovingHorizontal ? TILE_BASE_W : TILE_BASE_H;
            angle = isMovingHorizontal ? 90 : 0;
        }

        if (index > 0) {
            // Calculate step space: Half of previous tile + half of current tile
            let stepDist = isMovingHorizontal 
                ? (prevTile.w / 2) + (width / 2)
                : (prevTile.h / 2) + (height / 2);

            let nextX = headX + (vector[0] * stepDist);
            let nextY = headY + (vector[1] * stepDist);

            // ==========================================
            // 1. LEFT BRANCH LOGIC
            // ==========================================
            if (startDirection === 'left') {
                // First Turn: Heading Left -> Hit Left Boundary -> Turn UP
                if (vector[0] === -1 && nextX <= TRACK.leftX) {
                    vector = [0, -1]; 
                    isMovingHorizontal = false;
                    width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                    height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                    angle = tile.isDouble ? 90 : 0;

                    headX = TRACK.leftX;
                    headY = TRACK.bottomY - (prevTile.h / 2) - (height / 2);
                } 
                // Second Turn: Heading UP -> Hit Top Boundary -> Turn RIGHT
                else if (vector[1] === -1 && nextY <= TRACK.topY) {
                    vector = [1, 0]; // Head inward right
                    isMovingHorizontal = true;
                    width = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                    height = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                    angle = tile.isDouble ? 0 : 90;

                    headX = TRACK.leftX + (prevTile.w / 2) + (width / 2);
                    headY = TRACK.topY;
                } 
                else {
                    headX = nextX;
                    headY = nextY;
                }
            } 
            // ==========================================
            // 2. RIGHT BRANCH LOGIC
            // ==========================================
            else if (startDirection === 'right') {
                // First Turn: Heading Right -> Hit Right Boundary -> Turn UP
                if (vector[0] === 1 && nextX >= TRACK.rightX) {
                    vector = [0, -1]; 
                    isMovingHorizontal = false;
                    width = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                    height = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                    angle = tile.isDouble ? 90 : 0;

                    headX = TRACK.rightX;
                    headY = TRACK.bottomY - (prevTile.h / 2) - (height / 2);
                } 
                // Second Turn: Heading UP -> Hit Top Boundary -> Turn LEFT
                else if (vector[1] === -1 && nextY <= TRACK.topY) {
                    vector = [-1, 0]; // Head inward left
                    isMovingHorizontal = true;
                    width = tile.isDouble ? TILE_BASE_W : TILE_BASE_H;
                    height = tile.isDouble ? TILE_BASE_H : TILE_BASE_W;
                    angle = tile.isDouble ? 0 : 90;

                    headX = TRACK.rightX - (prevTile.w / 2) - (width / 2);
                    headY = TRACK.topY;
                } 
                else {
                    headX = nextX;
                    headY = nextY;
                }
            }
        } else {
            // Place initial tiles offsetting away from exact mid point 1400
            headX = (startDirection === 'left') ? headX - (width / 2) : headX + (width / 2);
        }

        layoutMap[tile.id] = { x: headX, y: headY, w: width, h: height, angle: angle };
        prevTile = { w: width, h: height };
    });

    return layoutMap;
}
