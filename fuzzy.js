//_____________________________________________________________________//
//_____________________________________________________________________//
//
//FUZZY SUBSET PROTOTYPE - DATA AND METHODS//
//
//_____________________________________________________________________//
//_____________________________________________________________________//

function FSS(fssName)
{
	this.fssName = fssName;
	this.coordX = new Array();
	this.coordY = new Array();
	//methods//
	this.FSS_Fill = FSS_Fill;
	this.FSS_GetMembershipValue = FSS_GetMembershipValue;
	this.FSS_Display = FSS_Display;
	this.FSS_MultiDisplay = FSS_MultiDisplay;
	this.FSS_TextDisplay = FSS_TextDisplay;
	this.FSS_Insert = FSS_Insert;
	this.FSS_Fuzzyfication = FSS_Fuzzyfication;
	this.FSS_GetYMin = FSS_GetYMin;
	this.FSS_GetYMax = FSS_GetYMax;
	this.FSS_GetFSSName = FSS_GetFSSName;
	this.FSS_SetFSSName = FSS_SetFSSName;
	this.FSS_GetCoordX = FSS_GetCoordX;
	this.FSS_GetCoordY = FSS_GetCoordY;
	this.FSS_SetCoordX = FSS_SetCoordX;
	this.FSS_SetCoordY = FSS_SetCoordY;
	this.FSS_GetNumberOfCoord = FSS_GetNumberOfCoord;
	this.FSS_AppendPoint = FSS_AppendPoint;
	this.FSS_Simplify = FSS_Simplify;
	this.FSS_CopyFrom = FSS_CopyFrom;
	this.FSS_Defuzzification = FSS_Defuzzification;
	this.FSS_BuildFuzzyImplicationFrom = FSS_BuildFuzzyImplicationFrom;
	this.FSS_PrependPoint = FSS_PrependPoint;
	this.FSS_InsertPointAtPosition = FSS_InsertPointAtPosition;
	this.FSS_CompleteWithZeros = FSS_CompleteWithZeros;
	this.FSS_GetSuperiorIndexOfXValue = FSS_GetSuperiorIndexOfXValue;
	this.FSS_GetNumberOfIdenticalXValueFrom = FSS_GetNumberOfIdenticalXValueFrom;
	//this.FSS_GetYCoordinatesAt = FSS_GetYCoordinatesAt;
}
//_____________________________________________________________________//
function FSS_Fill(x)
{
	var i, n;
	n = arguments.length / 2;
	this.coordX = new Array(n);
	this.coordY = new Array(n);
	for (i = 0; i < n; i++)
	{
		this.coordX[i] = arguments[2*i];
		this.coordY[i] = arguments[2*i+1];
	}
}

//_____________________________________________________________________//
function FSS_AppendPoint(x,y)
{
	this.coordX.push(x);
	this.coordY.push(y);
}


//_____________________________________________________________________//
function FSS_Simplify()
{
	//this function removes points of the FSS that are no use//
	//it means points who are identical to the previous and next ones//
	var i, y0, y1, y2, x0, x1;
	var begTabX, endTabX, begTabY, endTabY;
	var simplificationNumber = 0;
	//
	i = 1;
	//post("_____Simplification\n");
	//this.FSS_TextDisplay();
	do
	{
		x1 = this.coordX[i-1];
		y1 = this.coordY[i-1];
		x0 = this.coordX[i];
		y0 = this.coordY[i];
		y2 = this.coordY[i+1];
		if (((y1 == y0) && (y2 == y0)) || ((x1 == x0) && (y1 == y0)))
		{
			//remove ith point//
			begTabX = this.coordX.slice(0, i);
			endTabX = this.coordX.slice(i+1, this.coordX.length);
			begTabY = this.coordY.slice(0, i);
			endTabY = this.coordY.slice(i+1, this.coordY.length);
			this.coordX = begTabX.concat(endTabX);
			this.coordY = begTabY.concat(endTabY);
			simplificationNumber += 1;
			//this.FSS_TextDisplay();
		}
		else
		{
			i += 1;
		}
	} while (i < this.coordX.length-1)
	//post("nbr of simplications = ", simplificationNumber, "\n");
}

//_____________________________________________________________________//
function FSS_Display(num)
{
	//to send the values to the Javascript graphic interface//
	outlet(FSS_OUTLET, "fuzzySubset", this.fssName, num, this.coordX, this.coordY);
}

//_____________________________________________________________________//
function FSS_MultiDisplay(num, LVLabel)
{
	//to send the values to the Javascript graphic interface//
	//post("LVLabel=", LVLabel, "num=", num, "\n");
	//outlet(1, LVLabel, "fuzzySubset", this.fssName, num, this.coordX, this.coordY);
	outlet(FSS_OUTLET, LVLabel, "fuzzySubset", this.fssName, num, this.coordX, this.coordY);
}

//_____________________________________________________________________//
function FSS_TextDisplay()
{
	var i;
	var result = this.fssName + "\n";
	for (i = 0; i < this.coordX.length; i++)
	{
		result += "("+this.coordX[i]+","+this.coordY[i]+") ";
	}
	return result;
}


//_____________________________________________________________________//
function FSS_Fuzzyfication(x, dataMin, dataMax, fuzzyficationMethodID, halfKernelValue, leftBoundaryValue, rightBoundaryValue)
{
	var a, b, c, d, dx;
	dx = dataMax-dataMin;
	//post("fuzzyfication", x, dataMin, dataMax, fuzzyficationMethodID, "\n");
	switch(fuzzyficationMethodID)
	{
			case "TRIANGULAR_PERCENT":
			//post("Fuzzification\n");
			this.FSS_Fill(x-dx*leftBoundaryValue, 0.0, x, 1.0, x+dx*rightBoundaryValue, 0.0);
			break;

			case "TRIANGULAR_ABSOLUTE":
			this.FSS_Fill(x - leftBoundaryValue, 0.0, x, 1.0, x + rightBoundaryValue, 0.0);
			break;

			case "TRAPEZOIDAL_PERCENT":
			b = x - dx*halfKernelValue;
			c = x + dx*halfKernelValue;
			a = b - dx*leftBoundaryValue;
			d = c + dx*rightBoundaryValue;
			//post("fuzzy ->", a, b, c, d, "\n");
			this.FSS_Fill(a, 0.0, b, 1.0, c, 1.0, d, 0.0);
			break;

			case "TRAPEZOIDAL_ABSOLUTE":
			b = x - halfKernelValue;
			c = x + halfKernelValue;
			a = b - leftBoundaryValue;
			d = c + rightBoundaryValue;
			this.FSS_Fill(a, 0.0, b, 1.0, c, 1.0, d, 0.0);
			break;
					
			case "SINGLETON":
			this.FSS_Fill(x, 1.0, x, 0.0);
			break;
	}
}

//_____________________________________________________________________//
function FSS_GetMembershipValue(x)
{
	var i = 0;
	var n;
	var memberShipValue = 0.0;
	var trouve = 0;
	n = this.coordX.length;
	if ((x < this.coordX[0]) || (x > this.coordX[n-1]))
	{
		//post("0 direct, en dehors du support\n");
		memberShipValue = 0.0;
	}
	else
	{
		do
		{
			//post("******->x=", x, " i=", i, " xi=", this.coordX[i], " xi+1=", this.coordX[i+1], " yi=", this.coordY[i], "yi+1=", this.coordY[i+1], "\n");
			if (x == this.coordX[i])
			{
				memberShipValue = this.coordY[i];
				trouve = 1;
				//post("exact xi - membership = ", memberShipValue, "\n");
			}
			else
			{
				if (x == this.coordX[i+1])
				{
					memberShipValue = this.coordY[i+1];
					trouve = 1;
					//post("exact xi - membership = ", memberShipValue, "\n");
				}
				else
				{
					if ((x > this.coordX[i]) && (x < this.coordX[i+1]))
					{
						if (this.coordX[i+1] == this.coordX[i])
						{
							memberShipValue = this.coordY[i];
							//post("xi = xi+1 - membership = ", memberShipValue, " i=", i, "\n");
							trouve = 1;
						}
						else
						{
							memberShipValue = this.coordY[i]+(x-this.coordX[i])/(this.coordX[i+1]-this.coordX[i])*(this.coordY[i+1]-this.coordY[i]);
							//post("normal computation - membership = ", memberShipValue, " i=", i, "\n");
							trouve = 1;
						}
					}
				}
			}
			i += 1;
		} while ((i < n-1) && (trouve == 0));
	}
	return memberShipValue;
}

//_____________________________________________________________________//
function FSS_GetYMin()
{
	var mi = MAX_APP;
	var i;
	for (i=0; i < this.coordY.length; i++)
	{
		if (this.coordY[i] < mi)
		{
			mi = this.coordY[i];
		}
	}
	return mi;
}

//_____________________________________________________________________//
function FSS_GetYMax()
{
	var ma = MIN_APP;
	var i;
	for (i=0; i < this.coordY.length; i++)
	{
		if (this.coordY[i] > ma)
		{
			ma = this.coordY[i];
		}
	}
	return ma;
}

//_____________________________________________________________________//
function FSS_GetFSSName()
{
	return this.fssName;
}

//_____________________________________________________________________//
function FSS_SetFSSName(fssName)
{
	this.fssName = fssName;
}

//_____________________________________________________________________//
function FSS_GetCoordX(i)
{
	return this.coordX[i];
}

//_____________________________________________________________________//
function FSS_GetCoordY(i)
{
	return this.coordY[i];
}

//_____________________________________________________________________//
function FSS_SetCoordX(x, i)
{
	this.coordX[i] = x;
}

//_____________________________________________________________________//
function FSS_SetCoordY(y, i)
{
	this.coordY[i] = y;
}


//_____________________________________________________________________//
function FSS_GetNumberOfCoord()
{
	return this.coordX.length;
}


//_____________________________________________________________________//
function FSS_Insert(x, y)
{
	//to insert in right position x and y//
	var i = 0, trouve = 0;
	var n;
	var tab1X, tab2X, tab1Y, tab2Y, tx, ty;
	tx = new Array(1);
	tx[0] = x;
	ty = new Array(1);
	ty[0] = y;
	n = this.FSS_GetNumberOfCoord();
	//post("Insertion of ", x, " and ", y, "\n");
	if (n == 0)
	{
		//the FSS is still empty//
		//post("empty fss\n");
		this.coordX = new Array(1);
		this.coordY = new Array(1);
		this.coordX[0] = x;
		this.coordY[0] = y;
		trouve = 1;
		//post("insertion at rank 0 in empty array\n");
	}
	else
	{
		if (x > this.coordX[n-1])
		{
			//the element to add is greater than the greater of elements already in the FSS//
			this.coordX[n] = x;
			this.coordY[n] = y;
			trouve = 1;
			//post("insertion at end at rank ", n, "\n");
		}
		else
		{
			do
			{
				//post("after do -> i = ", i, " trouve = ", trouve," x = ", x, " coordX[i] = ", this.coordX[i], "\n");
				if (x < this.coordX[i])
				{
					//post("after if x < coordX -> i = ", i, " x = ", x, " coordX[i] = ", this.coordX[i], "\n");
					trouve = 1;
					tab2X = this.coordX.slice(i, this.coordX.length);//slice does not include the last indexed element//
					tab2Y = this.coordY.slice(i, this.coordY.length);
					if (i > 0)
					{
						tab1X = this.coordX.slice(0, i);
						tab1Y = this.coordY.slice(0, i);
						this.coordX = tab1X.concat(tx);
						this.coordY = tab1Y.concat(ty);
						this.coordX = this.coordX.concat(tab2X);
						this.coordY = this.coordY.concat(tab2Y);
					}
					else
					{
						//the element to insert is in first position//
						this.coordX = tx.concat(tab2X);
						this.coordY = ty.concat(tab2Y);
					}
				}
				else
				{
					if (x == this.coordX[i])
					{
						//element already inserted//
						trouve = 1;
						//changed from original, If we try to insert, overwrite the old value.
						this.coordY[i] = y;
					}
					else
					{
						//element to be inserted on the right//
						i += 1;
					}
				}
			} while ((i < n) && (trouve == 0));
		}
		//if (trouve == 1)
//		{
//			post("insertion at rank ", i, "\n");
//			this.FSS_TextDisplay();
//		}
		//else
		//{
			//post("no insertion possible\n");
		//}
	}
}

//_____________________________________________________________________//
//
//_____________________________________________________________________//
function FSS_PrependPoint(x,y)
{
	//
	this.coordX.unshift(x);
	this.coordY.unshift(y);
}


//_____________________________________________________________________//
//
//_____________________________________________________________________//
function FSS_InsertPointAtPosition(x, y, i)
{
	var tab1 = new Array();
	var tab2 = new Array();
	//
	//insertion into coordX array//
	tab1 = this.coordX.slice(0, i);
	tab2 = this.coordX.slice(i, this.coordX.length);
	tab1.push(x);
	this.coordX = tab1.concat(tab2);
	//insertion into coordY array//
	tab1 = this.coordY.slice(0, i);
	tab2 = this.coordY.slice(i, this.coordY.length);
	tab1.push(y);
	this.coordY = tab1.concat(tab2);
}


//_____________________________________________________________________//
//
//_____________________________________________________________________//
function FSS_CompleteWithZeros(dmin, dmax)
{
	var x0, y0;
	x0 = this.coordX[0];
	y0 = this.coordY[0];
	//post("Ajout 1er point => x0=", x0, " y0=", y0, "\n");
	if ((y0 != 0.0) && (x0 > dmin))
	{
		//we add an initial point on the x axis only if the fss does not start at dmin//
		this.FSS_PrependPoint(x0, 0.0);
	}
	x0 = this.coordX[this.coordX.length-1];
	y0 = this.coordY[this.coordY.length-1];
	//post("Ajout dernier point => x0=", x0, " y0=", y0, "\n");
	if ((y0 != 0.0) && (x0 < dmax))
	{
		//we add a terminal point on the x axis only if the fss does not end at dmax//
		this.FSS_AppendPoint(x0, 0.0);
	}
}

//_____________________________________________________________________//
//
//_____________________________________________________________________//
function FSS_CopyFrom(fss2)
{
	var i, n;
	this.fssName = fss2.FSS_GetFSSName();
	n = this.FSS_GetNumberOfCoord();
	this.coordX = new Array();
	this.coordY = new Array();
	for (i = 0; i < n; i++)
	{
		this.coordX.push(fss2.FSS_GetCoordX(i));
		this.coordY.push(fss2.FSS_GetCoordY(i));
	}
}

//var modellingFSS;
//var fssVal;

//_____________________________________________________________________//
//
//_____________________________________________________________________//
function FSS_Defuzzification()
{
	var i, n, num, den, x0, y0, x1, y1;
	num =  0;
	den = 0;
	n = this.FSS_GetNumberOfCoord();
	for (i = 1; i < n; i++)
	{
		x0 = this.coordX[i-1];
		y0 = this.coordY[i-1];
		x1 = this.coordX[i];
		y1 = this.coordY[i];
		num += (x1-x0)*((2*x1+x0)*y1+(2*x0+x1)*y0);
		den += (x1-x0)*(y1+y0);
	}
	if (den == 0)
	{
		return 0;
	}
	else
	{
		return (num/(3*den));
	}
}

//_____________________________________________________________________//
//
//_____________________________________________________________________//
function FSS_BuildFuzzyImplicationFrom(fa, fi, dmin, dmax)
{
	var i, n, x, y;
	var resultFSS = new FSS("");
	

	//
	n = this.coordX.length;
	//post("n=", n, "\n");
	//this.FSS_TextDisplay();
	
	//post("FuzzyImplication\n");
	//post("x=", x, "y=", y, "\n");
	switch(fi)
	{
		//_____________________________________________________________________//
		case FI_REICHENBACH:
		//post("fa=", fa, "\n");
		for (i=0; i < n; i++)
		{
			x = this.coordX[i];
			y = this.coordY[i];
			resultFSS.FSS_AppendPoint(x, 1.0-fa+fa*y);
		}
		resultFSS.FSS_CompleteWithZeros(dmin, dmax);
		//post("\n\n");
		//post("Fuzzy Implication ->");
		//resultFSS.FSS_TextDisplay();
		break;
		
		//_____________________________________________________________________//
		case FI_WILLMOTT:
		var fss1 = new FSS("");
		var fss2 = new FSS("");
		var fss3 = new FSS("");
		//Build Min(fa, fB) FSS//
		//first build fa constant FSS, then operate min with current FSS//
		//fss1.FSS_AppendPoint(this.coordX[0], 0.0);
		fss1.FSS_AppendPoint(this.coordX[0], fa);
		fss1.FSS_AppendPoint(this.coordX[n-1], fa);
		//fss1.FSS_AppendPoint(this.coordX[n-1], 0.0);
		fss2 = LV_Operation(TNORM_MIN, fss1, this, dmin, dmax);
		//Build Max(1-fa, previous min)//
		//fss3.FSS_AppendPoint(this.coordX[0], 0.0);
		fss3.FSS_AppendPoint(this.coordX[0], 1.0-fa);
		fss3.FSS_AppendPoint(this.coordX[n-1], 1.0-fa);
		//fss3.FSS_AppendPoint(this.coordX[n-1], 0.0);
		resultFSS = LV_Operation(TCONORM_MAX, fss3, fss2, dmin, dmax);
		//post("Fuzzy Implication ->");
		//resultFSS.FSS_TextDisplay();
		break;
		
		//_____________________________________________________________________//
		case FI_RESCHER_GAINES:
		var fss1 = new FSS("");
		//Build Max(fa, fb) FSS//
		//First build fa constant FSS//
		fss1.FSS_AppendPoint(this.coordX[0], fa);
		fss1.FSS_AppendPoint(this.coordX[n-1], fa);
		resultFSS = LV_Operation(TNORM_MIN, fss1, this, dmin, dmax);
		//Then replace fa values by 0, and other values greater than fa by 1//
		n = resultFSS.FSS_GetNumberOfCoord();
		for (i=0; i < n; i++)
		{
			y = resultFSS.FSS_GetCoordY(i);
			//post("y=", y, "fa=", fa, "\n");
			if (y >= fa)
			{
				resultFSS.FSS_SetCoordY(1.0, i);
			}
			else
			{
				resultFSS.FSS_SetCoordY(0.0, i);
			}
		}
		//
		i = 0;
		while (i < resultFSS.FSS_GetNumberOfCoord())
		{
			x = resultFSS.FSS_GetCoordX(i);
			if (resultFSS.FSS_GetCoordY(i) == 1.0)
			{
				if (i > 0)
				{
					if ((resultFSS.FSS_GetCoordY(i-1) == 0.0) && (x > resultFSS.FSS_GetCoordX(i-1)))
					{
						//in this case, we insert a zero at position i//
						//post("Avant insertion up = ");
						//resultFSS.FSS_TextDisplay();
						resultFSS.FSS_InsertPointAtPosition(resultFSS.FSS_GetCoordX(i), 0., i);
						//post("AprËs insertion = ");
						//resultFSS.FSS_TextDisplay();
						//resultFSS.FSS_SetCoordX(resultFSS.FSS_GetCoordX(i), i-1);
					}
				}
				if (i < resultFSS.FSS_GetNumberOfCoord()-1)
				{
					if ((resultFSS.FSS_GetCoordY(i+1) == 0.0) && (x < resultFSS.FSS_GetCoordX(i+1)))
					{
						//post("Avant insertion down = ");
						//resultFSS.FSS_TextDisplay();
						//in this case, we insert a zero at position i+1//
						resultFSS.FSS_InsertPointAtPosition(resultFSS.FSS_GetCoordX(i), 0., i+1);
						//post("AprËs insertion = ");
						//resultFSS.FSS_TextDisplay();
						//resultFSS.FSS_SetCoordX(resultFSS.FSS_GetCoordX(i), i+1);
					}
				}
			}
			i += 1;
		}
		resultFSS.FSS_CompleteWithZeros(dmin, dmax);
		//post("Fuzzy Implication ->");
		//resultFSS.FSS_TextDisplay();
		//resultFSS.FSS_TextDisplay();
		break;
		
		//_____________________________________________________________________//
		case FI_KLEENE_DIENES:
		var fss1 = new FSS("");
		//Build Max(1-fa, fb) FSS//
		//First build 1-fa constant FSS//
		fss1.FSS_AppendPoint(this.coordX[0], 1.0-fa);
		fss1.FSS_AppendPoint(this.coordX[n-1], 1.0-fa);
		resultFSS = LV_Operation(TCONORM_MAX, fss1, this, dmin, dmax);
		//post("Fuzzy Implication ->");
		//resultFSS.FSS_TextDisplay();
		//y2 = Math.max(1.0-fa, y);
		break;
		
		
		//_____________________________________________________________________//
		case FI_BROUWER_GOEDEL:
		var fss1 = new FSS("");
		//Build Max(fa, fb) FSS//
		//First build fa constant FSS//
		fss1.FSS_AppendPoint(this.coordX[0], fa);
		fss1.FSS_AppendPoint(this.coordX[n-1], fa);
		resultFSS = LV_Operation(TNORM_MIN, fss1, this, dmin, dmax);
		//Then replace fa values by 0, and other values greater than fa by 1//
		//n = resultFSS.FSS_GetNumberOfCoord();
		i=0;
		while ((i < resultFSS.FSS_GetNumberOfCoord()) && (i < 40))
		{
			//post("i=", i, "\n");
			x = resultFSS.FSS_GetCoordX(i);
			y = resultFSS.FSS_GetCoordY(i);
			//post("y=", y, "fa=", fa, "nbre de points =", resultFSS.FSS_GetNumberOfCoord(), "\n");
			if ((y > fa) || (Math.abs(y-fa) < 0.001))
			{
				resultFSS.FSS_SetCoordY(1.0, i);
				//post("y modification to 1 => ");
				//resultFSS.FSS_TextDisplay();
				//insert another point//
				if (i > 0)
				{
					if ((resultFSS.FSS_GetCoordY(i-1) < y) && (x > resultFSS.FSS_GetCoordX(i-1)))
					{
						//post("Insertion before\n");
						resultFSS.FSS_InsertPointAtPosition(resultFSS.FSS_GetCoordX(i), y, i);
						//resultFSS.FSS_TextDisplay();
						i += 1;
					}
				}
				if (i < resultFSS.FSS_GetNumberOfCoord()-1)
				{
					if ((resultFSS.FSS_GetCoordY(i+1) < y) && (x < resultFSS.FSS_GetCoordX(i+1)))
					{
						//post("Insertion after\n");
						resultFSS.FSS_InsertPointAtPosition(resultFSS.FSS_GetCoordX(i), y, i+1);
						//resultFSS.FSS_TextDisplay();
						i += 1;
					}
				}
			}
			i += 1;
		}
		
		resultFSS.FSS_CompleteWithZeros(dmin, dmax);
		//post("Fuzzy Implication ->");
		//resultFSS.FSS_TextDisplay();
		//resultFSS.FSS_TextDisplay();
		break;
		
		
		//_____________________________________________________________________//
		case FI_GOGUEN:
		var fss1 = new FSS("");
		var fss2 = new FSS("");
		//post("______\n");
		if (fa == 0.0)
		{
			//post("fa = 0\n");
			resultFSS.FSS_AppendPoint(this.coordX[0], 0.0);
			resultFSS.FSS_AppendPoint(this.coordX[0], 1.0);
			resultFSS.FSS_AppendPoint(this.coordX[n-1], 1.0);
			resultFSS.FSS_AppendPoint(this.coordX[n-1], 0.0);
			//resultFSS.FSS_TextDisplay();
		}
		else
		{
			//post("fa != 0\n");
			for (i=0; i < n; i++)
			{
				x = this.coordX[i];
				y = this.coordY[i];
				fss1.FSS_AppendPoint(x, y/fa);
			
			}
			//fss1.FSS_TextDisplay();
			//fss2.FSS_AppendPoint(this.coordX[0], 0.0);
			fss2.FSS_AppendPoint(this.coordX[0], 0.0);
			fss2.FSS_AppendPoint(this.coordX[0], 1.0);
			fss2.FSS_AppendPoint(this.coordX[n-1], 1.0);
			fss2.FSS_AppendPoint(this.coordX[n-1], 0.0);
			//fss2.FSS_AppendPoint(this.coordX[n-1], 0.0);
			//fss2.FSS_TextDisplay();
			resultFSS = LV_Operation(TNORM_MIN, fss1, fss2, dmin, dmax);
			//resultFSS.FSS_TextDisplay();
		}
		break;
		
		//_____________________________________________________________________//
		case FI_LUKASIEWICZ:
		//post("______\n");
		var fss1 = new FSS("");
		var fss2 = new FSS("");
		
		for (i=0; i < n; i++)
		{
			x = this.coordX[i];
			y = this.coordY[i];
			fss1.FSS_AppendPoint(x, 1.0-fa+y);
			
		}
		//fss1.FSS_TextDisplay();
		fss2.FSS_AppendPoint(this.coordX[0], 0.0);
		fss2.FSS_AppendPoint(this.coordX[0], 1.0);
		fss2.FSS_AppendPoint(this.coordX[n-1], 1.0);
		fss2.FSS_AppendPoint(this.coordX[n-1], 0.0);
		//fss2.FSS_TextDisplay();
		resultFSS = LV_Operation(TNORM_MIN, fss1, fss2, dmin, dmax);
		//resultFSS.FSS_TextDisplay();
		//y2 =  Math.min(1.0-fa+y, 1.);
		break;
		
		//_____________________________________________________________________//
		case FI_MAMDANI:
		var fss1 = new FSS("");
		fss1.FSS_AppendPoint(this.coordX[0], 0.0);
		fss1.FSS_AppendPoint(this.coordX[0], fa);
		fss1.FSS_AppendPoint(this.coordX[n-1], fa);
		fss1.FSS_AppendPoint(this.coordX[n-1], 0.0);
		resultFSS = LV_Operation(TNORM_MIN, fss1, this, dmin, dmax);
		//y2 = Math.min(fa,y);
		break;
		
		//
		//_____________________________________________________________________//
		case FI_LARSEN:
		
		for (i=0; i < n; i++)
		{
			x = this.coordX[i];
			y = this.coordY[i];
			resultFSS.FSS_AppendPoint(x, fa*y);
		}
		break;
	}
	
	return resultFSS;
}


//_____________________________________________________________________//
//
//_____________________________________________________________________//
function FSS_GetSuperiorIndexOfXValue(i, x)
{
	var j, n;
	//
	j = i;
	n = this.coordX.length;
	//post("Function GetSuperiorIndexOfXValue i = ", i, " x = ", x, "\n");
	
	while ((this.coordX[j] < x) && (j < n))
	{
		j += 1;
		//post("j=", j, "\n");
	}
	if (j == n)
	{
		return (n-1);
	}
	else
	{
		if (this.coordX[j] > x)
		{
			return (-1);
		}
		else
		{
			return j;
		}
	}
	
	return i;
}


//____________________________________________________________________________________//
//Returns the number of elements identical to x starting at i position in array coordX
//____________________________________________________________________________________//
function FSS_GetNumberOfIdenticalXValueFrom(i, x)
{
	var j, k, n;
	//
	j = i+1;
	k = 1;
	n = this.coordX.length;
	while((j < n) && (this.coordX[j] == x))
	{
		k += 1;
		j += 1;
	}
	return k;
}


